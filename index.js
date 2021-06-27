const cron = require('node-cron');
const express = require('express');
const fetch = require('node-fetch');
const TT_URL = new URL('https://tradetron.tech/api/deployed-strategies');
let holidayList = require('./foHolidays.json');
const TZ_INDIA = "Asia/Kolkata";
require( 'console-stamp' )( console ); //Adds timestamps to all console messages

const PROFIT = '🟢';
const LOSS = '🔴';

var app = express();

//Load the .env
const dotenv = require('dotenv');
dotenv.config();

const options = {
    headers: {
        'Accept': 'application/json',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': process.env.TT_COOKIE
    }
}

TT_URL.searchParams.append("execution", process.env.TRADE_TYPE);
TT_URL.searchParams.append("creator_id", process.env.TT_CREATOR_ID);

const TELEGRAM_POST_URL = new URL('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/sendMessage');
TELEGRAM_POST_URL.searchParams.append("chat_id", process.env.TELEGRAM_CHAT_ID);
TELEGRAM_POST_URL.searchParams.append("parse_mode", "HTML");
const TELEGRAM_DEBUG = new URL('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/sendMessage');
TELEGRAM_DEBUG.searchParams.append("chat_id", process.env.TELEGRAM_CHAT_ID_DEBUG);

console.log("Application fully loaded, waiting for all the crons to do magic");

//Compute holiday checker once a day or on server restart.
let isTodayHoliday = null;
function isHoliday() {
    return false;
    //Check if it is a weekend.
    let weekend = new Date().getDay()%6 == 0; //Sunday is 0 and Saturday is 6. 0%6 and 6%6 will be zero
    if(weekend) return weekend;

    let holidayArray = holidayList.FO.filter((dt) => {return moment().isSame(new Date(dt.tradingDate), 'day')});
    return (holidayArray.length > 0);

}

//Telegram transporter. Needs to be refactored to be used only for transporting by taking a payload
async function telegram() {
    const res = await fetch(TT_URL.href, options);
    if(!res.ok) throw { name: 'Fetch API Error', message: res.statusText, status: res.status };

    const strategies = await res.json();
    console.log('Number of strategies = ', strategies.data.length);
    let telegram_msg = `<b>💰 PNL - </b> ${process.env.TRADE_TYPE} 💰 \r\n\r\n`;
    let total_pnl = 0.0;
    strategies.data.forEach(deployment => {
        //Only report the Live or Exited PNL
        if ((deployment.status.search('Live-Entered') >= 0) || (deployment.status.search('Exited') >= 0)) {
            let pnl = parseFloat(deployment.sum_of_pnl).toFixed(2);
            total_pnl += parseFloat(deployment.sum_of_pnl);

            //pruning only the strategy name by removing anything after //
            let name = deployment.template.name.slice(0, deployment.template.name.indexOf('/')).trim();
            //console.log(deployment.status + " " + process.env.TRADE_TYPE + " >> " + name + " >> " + deployment.currency + pnl);

            //Construct the message to be passed to telegram
            telegram_msg += (pnl >= 0) ? PROFIT : LOSS;
            telegram_msg += (deployment.status.search('Exited')>=0) ? ` <s>${name}</s>` : `${name}`;
            telegram_msg += ` <b>${deployment.currency}${pnl}</b>\r\n`;
        }
    });
    telegram_msg += '\r\n';
    telegram_msg += (total_pnl >= 0) ? PROFIT : LOSS;
    telegram_msg += ` TOTAL PNL = <b> ${parseFloat(total_pnl).toFixed(2)} </b>`;

    //POST call to Telegram
    let full_telegram_url = new URL(TELEGRAM_POST_URL.toString());
    full_telegram_url.searchParams.append("text", telegram_msg);
    fetch(full_telegram_url, { method: 'POST' });

}
//Schedule tasks to be run on the server.
//“At every 15th minute past every hour from 4 through 10 UTC time on every day-of-week from Monday through Friday.”
//*/15 4-9 * * 1-5
cron.schedule(process.env.CRONEXP, () => {
    if(isTodayHoliday == null) isTodayHoliday = isHoliday();
    if(isTodayHoliday) {
        console.log("Weekend or NSE Holiday, skipping telegram task");
        return;
    }
    console.log("cron task1 runs basis ", process.env.CRONEXP);
    console.log('running a task every 15 minutes between 09:30 and 15:30 IST, current time is ', new Date().toString());

    telegram().catch(error => {
        let url = new URL(TELEGRAM_DEBUG.toString());
        url.searchParams.append("text", "Error in TT API invocation " + error.message);
        fetch(url, { method: 'POST' })
        console.error(error);
    });
}, {
    scheduled: true,
    timezone: TZ_INDIA
});


//GOOGLE SHEET INTEGRATION

const {JWT} = require('google-auth-library');
const pkEmail = process.env.PK_EMAIL;
const pkpk = process.env.PK_PK.replace(/\\n/g, '\n'); //This is workaround to read the private key which already has \n in it.
const {google} = require('googleapis');
const HEADER_ROW_DATA = ['Time', 'Apache', 'Brahmos', 'Falcon', 'Amogha', 'Shaurya', 'Total']; // This will be injected to a fresh google sheet on its creation
const SHEET_RANGE = "!A1:G1"; //Represents the above 7 cells 

//Do once to create the JWT client on server start
const client = new JWT({
  email: pkEmail,
  key: pkpk,
  scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

//Global variable to keep the token, just before expiry we will refresh it to get new
let autoRefreshingTokens = null;

const moment = require('moment-timezone');
function getRangeName(range) {
    var today = moment.utc().tz(TZ_INDIA);

    return today.format("DDMMMYYYY").concat(range).toString();
}

function getDatestamp() {
    var today = moment.utc().tz(TZ_INDIA);
    return today.format("DDMMMYYYY").toString();
}

function getTimestamp() {
    var today = moment.utc().tz(TZ_INDIA);
    return today.format("HH:mm").toString();
}

async function googleSheetUpdater() {
    let validTokens = false;
    if(autoRefreshingTokens) {
        let diff = autoRefreshingTokens.expiry_date - new Date().getTime();
        if(diff > 6*60*1000) { //if diff is less than 6 minutes
            validTokens = true;
        }
    }
    if(!validTokens) {
        console.log("Tokens have expired, fetching new tokens...");
        autoRefreshingTokens = await client.authorize();
    }

    const res = await fetch(TT_URL.href, options);
    if(!res.ok) throw { name: 'Fetch API Error', message: res.statusText, status: res.status };
    const strategies = await res.json();
    let valueArray = new Array(HEADER_ROW_DATA.length).fill(0);
    valueArray[0] = getTimestamp();//Time is pushed to the first column.
    let total_pnl = 0.0;
    strategies.data.forEach(deployment => {
        //Only report the Live or Exited PNL
        if ((deployment.status.search('Live-Entered') >= 0) || (deployment.status.search('Exited') >= 0)) {
            let pnl = parseFloat(deployment.sum_of_pnl).toFixed(2);
            total_pnl += parseFloat(deployment.sum_of_pnl);

            //pruning only the strategy name by removing anything after //
            let name = deployment.template.name.slice(0, deployment.template.name.indexOf('/')).trim();
            valueArray[HEADER_ROW_DATA.indexOf(name)] = pnl;
        }
    });
    valueArray[HEADER_ROW_DATA.length - 1] = total_pnl;//Total pnl is pushed to the last column

    const sheets = google.sheets('v4');
    let rangeName = getRangeName(SHEET_RANGE);
    const results = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GSHEET_ID,
        valueInputOption: "USER_ENTERED",
        range: rangeName,
        resource: {range: rangeName, majorDimension: "ROWS", values: [valueArray]},
        auth: client
    });
}

function errorCB(error, response) {
    console.error(error.response);
    let url = new URL(TELEGRAM_DEBUG.toString());
    url.searchParams.append("text", "Error in Google Sheets " + JSON.stringify(error.response.data));
    fetch(url, { method: 'POST' })
}

//Schedule tasks to be run on the server.
//“At every 15th minute past every hour from 9 through 15 on every day-of-week from Monday through Friday.”
//*/5 9-14 * * 1-5
cron.schedule(process.env.CRONEXP2, function () {
    if(isTodayHoliday == null) isTodayHoliday = isHoliday();
    if(isTodayHoliday) {
        console.log("Weekend or NSE Holiday, skipping google sheet task");
        return;
    }
    console.log("cron google sheet task runs basis ", process.env.CRONEXP2);
    console.log('running a task every 5 minutes between 09:00 and 15:00 IST, current time is ', new Date().toString());
    googleSheetUpdater().catch(errorCB);
}, {
    scheduled: true,
    timezone: TZ_INDIA
});

async function googleSheetInit() {
    //Authorize the client to generate fresh tokens. We need not check for validity. Just do it.
    autoRefreshingTokens = await client.authorize();
    const sheets = google.sheets('v4');
    //TODO : create a new sheet once per day (only working days)
    const newSheet = await sheets.spreadsheets.batchUpdate({
        spreadsheetId: process.env.GSHEET_ID,
        resource: {requests: [{"addSheet":{"properties":{"title": getDatestamp()}}}]},
        auth: client
    });

    let rangeName = getRangeName(SHEET_RANGE);
    const results = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GSHEET_ID,
        valueInputOption: "USER_ENTERED",
        range: rangeName,
        resource: {range: rangeName, majorDimension: "ROWS", values: [HEADER_ROW_DATA]},
        auth: client
    });
}

//Schedule tasks to be run on the server.
//“At 01:00 on every day-of-week from Monday through Friday.”
//0 1 * * 1-5
cron.schedule(process.env.CRON_DAILY_SYSTEM_INIT, () => {
    if(isTodayHoliday == null) isTodayHoliday = isHoliday();
    if(isTodayHoliday) {
        console.log("Weekend or NSE Holiday, skipping 1am housekeeping task");
        return;
    }
    console.log("cron housekeeping task runs once ", process.env.CRON_DAILY_SYSTEM_INIT);
    console.log('running a task once a day, current time is ', new Date().toString());
    googleSheetInit().catch(errorCB);
}, {
    scheduled: true,
    timezone: TZ_INDIA
});

// Holiday checker at startup
isTodayHoliday = isHoliday();
if(isTodayHoliday) {
    console.log("Its is a holiday, so lets hope no crons are awake");
}

console.log(`Cron check ${process.env.CRONEXP} => ` + cron.validate(process.env.CRONEXP));
console.log(`Cron check ${process.env.CRONEXP2} => ` + cron.validate(process.env.CRONEXP2));
console.log(`Cron check ${process.env.CRON_DAILY_SYSTEM_INIT} =>` + cron.validate(process.env.CRON_DAILY_SYSTEM_INIT));
app.listen(process.env.PORT);