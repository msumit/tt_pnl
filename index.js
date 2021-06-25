const cron = require('node-cron');
const express = require('express');
const fetch = require('node-fetch');
const TT_URL = new URL('https://tradetron.tech/api/deployed-strategies');
const CREATOR_ID = 193528;

const PROFIT = '🟢';
const LOSS = '🔴';

var app = express();

const dotenv = require('dotenv');
dotenv.config();
//console.log(`Your port is ${process.env.PORT}`); // 8626

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

console.log("Application fully loaded, waiting for cron to do magic");
//Schedule tasks to be run on the server.
//“At every 15th minute past every hour from 4 through 10 UTC time on every day-of-week from Monday through Friday.”
//*/15 4-9 * * 1-5
cron.schedule(process.env.CRONEXP, function () {
    //if (isDuringTradeingHours()) {
    console.log('running a task every minute between 09:30 and 15:30 IST, current time is ', new Date().toString());
    fetch(TT_URL.href, options)
        .then(res => {
            if (res.ok) {
                res.json().then((strategies) => {
                    console.log('Number of strategies = ', strategies.data.length);
                    let telegram_msg = '<b>💰 PNL - </b>' + process.env.TRADE_TYPE + ' 💰' + '\r\n\r\n';
                    let total_pnl = 0.0;
                    strategies.data.forEach(deployment => {
                        //Only report the Live or exited PNL
                        if ((deployment.status.search('Live-Entered') || deployment.status.search('Exited')) >= 0) {
                            let pnl = parseFloat(deployment.sum_of_pnl).toFixed(2);
                            total_pnl += parseFloat(deployment.sum_of_pnl);

                            //pruning only the strategy name by removing anything after //
                            let name = deployment.template.name.slice(0, deployment.template.name.indexOf('/'));
                            //console.log(deployment.status + " " + process.env.TRADE_TYPE + " >> " + name + " >> " + deployment.currency + pnl);

                            //TODO : Google sheet integration to send each deployment PNL

                            //Construct the message to be passed to telegram
                            telegram_msg += (pnl >= 0) ? PROFIT : LOSS;
                            telegram_msg += ' ' + name + ' ' + '<b>' + deployment.currency + pnl + '</b>' + '\r\n';
                        }
                    });
                    telegram_msg += '\r\n';
                    telegram_msg += (total_pnl >= 0) ? PROFIT : LOSS;
                    telegram_msg += " TOTAL PNL = " + '<b>' + parseFloat(total_pnl).toFixed(2) + '</b>';

                    //console.log(telegram_msg);
                    //POST call to Telegram
                    let full_telegram_url = new URL(TELEGRAM_POST_URL.toString());
                    full_telegram_url.searchParams.append("text", telegram_msg);
                    fetch(full_telegram_url, { method: 'POST' });
                })
            } else {
                console.log('Error encountered', res.status, res.statusText);
                throw { name: 'Fetch API Error', message: res.statusText, status: res.status };
            }
        })
        .catch(error => {
            let url = new URL(TELEGRAM_DEBUG.toString());
            url.searchParams.append("text", error.name + " " + error.message);
            fetch(url, { method: 'POST' });

            console.log(error);
        })
    //}
});

// function isDuringTradeingHours() {
//     //From env file
//     //START_TIME=430; //Number representing UTC time 04:30am => 10AM IST
//     //END_TIME=930; //Number representing UTC time 09:30 => 3PM IST

//     var d = new Date();
//     var currentTime = d.getUTCHours()*100 + d.getUTCMinutes();
//     // return (currentTime >= process.env.START_TIME && currentTime <= process.env.END_TIME);
//     return true;
// }

// TEST CODE, to see if deployment works on remote server
// let full_telegram_url = new URL(TELEGRAM_POST_URL.toString());
// full_telegram_url.searchParams.append("text", new Date().toString());
// fetch(full_telegram_url, {method: 'POST'});

app.listen(process.env.PORT);