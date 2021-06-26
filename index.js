const cron = require('node-cron');
const express = require('express');
const fetch = require('node-fetch');
const TT_URL = new URL('https://tradetron.tech/api/deployed-strategies');
const CREATOR_ID = 193528;

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
TT_URL.searchParams.append("creator_id", CREATOR_ID);

const TELEGRAM_POST_URL = new URL('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/sendMessage');
TELEGRAM_POST_URL.searchParams.append("chat_id", process.env.TELEGRAM_CHAT_ID);
TELEGRAM_POST_URL.searchParams.append("parse_mode", "HTML");
const TELEGRAM_DEBUG = new URL('https://api.telegram.org/bot' + process.env.TELEGRAM_BOT_TOKEN + '/sendMessage');
TELEGRAM_DEBUG.searchParams.append("chat_id", process.env.TELEGRAM_CHAT_ID_DEBUG);

console.log("Application fully loaded, waiting for all the crons to do magic");

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
cron.schedule(process.env.CRONEXP, function () {
    console.log("cron task1 runs basis ", process.env.CRONEXP);
    console.log('running a task every 15 minutes between 09:30 and 15:30 IST, current time is ', new Date().toString());

    telegram().catch(error => {
        let url = new URL(TELEGRAM_DEBUG.toString());
        url.searchParams.append("text", "Error in TT API invocation " + error.message);
        fetch(url, { method: 'POST' })
        console.error(error);
    });
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
    var today = moment.utc().tz("Asia/Kolkata");

    return today.format("DDMMMYYYY").concat(range).toString();
}

function getDatestamp() {
    var today = moment.utc().tz("Asia/Kolkata");
    return today.format("DDMMMYYYY").toString();
}

function getTimestamp() {
    var today = moment.utc().tz("Asia/Kolkata");
    return today.format("HH:MM").toString();
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
    let mockData = [];
    mockData.push(getTimestamp()); //Time
    mockData.push(parseFloat(Math.random()*1000)).toFixed(2); //Strategy 1
    mockData.push(parseFloat(Math.random()*1000)).toFixed(2); //Strategy 2
    mockData.push(parseFloat(Math.random()*1000)).toFixed(2); //Strategy 3
    mockData.push(parseFloat(Math.random()*1000)).toFixed(2); //Strategy 4
    mockData.push(parseFloat(Math.random()*1000)).toFixed(2); //Strategy 5
    mockData.push(parseFloat(Math.random()*1000)).toFixed(2); //Total
    const sheets = google.sheets('v4');
    let rangeName = getRangeName(SHEET_RANGE);
    const results = await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.GSHEET_ID,
        valueInputOption: "USER_ENTERED",
        range: rangeName,
        resource: {range: rangeName, majorDimension: "ROWS", values: [mockData]},
        auth: client
    });


}

//Schedule tasks to be run on the server.
//“At every 15th minute past every hour from 4 through 10 UTC time on every day-of-week from Monday through Friday.”
//*/5 4-9 * * 1-5
cron.schedule(process.env.CRONEXP2, function () {
    console.log("cron task2 runs basis ", process.env.CRONEXP2);
    console.log('running a task every 5 minutes between 09:30 and 15:30 IST, current time is ', new Date().toString());
    googleSheetUpdater().catch(console.error);
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
    console.log("cron task3 runs once ", process.env.CRON_DAILY_SYSTEM_INIT);
    console.log('running a task once a day, current time is ', new Date().toString());
    googleSheetInit().catch(console.error);
});

// TEST CODE, to see if deployment works on remote server
// let full_telegram_url = new URL(TELEGRAM_POST_URL.toString());
// full_telegram_url.searchParams.append("text", new Date().toString());
// fetch(full_telegram_url, {method: 'POST'});
app.listen(process.env.PORT);