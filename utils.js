const moment = require('moment-timezone');
const appConfig = require('./config');
let holidayList = require('./data/holidayLookUp.json');
const tradeTypeObj = {"LIVE AUTO":"LA", "PAPER TRADING" : "PT"}; 
const mapper = require("./mapping.json");

function getDatestamp() {
    let today = moment.utc().tz(appConfig.app.TZ_INDIA);
    return today.format("DDMMMYYYY").toString();
}

function getRangeName(range) {
    return getDatestamp().concat(range).toString();
}

function getTimestamp() {
    let today = moment.utc().tz(appConfig.app.TZ_INDIA);
    return today.format("HH:mm").toString();
}

function getDateTimestamp() {
    let today = moment.utc().tz(appConfig.app.TZ_INDIA);
    return today.format("DD-MMM-YYYY HH:mm:ss").toString();
}

function isHoliday() {
    //Check if it is a weekend.
    let isWeekend = ((moment.utc().tz(appConfig.app.TZ_INDIA).day() % 6) == 0); //Sunday is 0 and Saturday is 6. 0%6 and 6%6 will be zero
    console.info("Is it Weekend? => ", isWeekend ? 'Yes' : 'No');
    if (isWeekend) return isWeekend;

    let currentDate = moment.utc().tz(appConfig.app.TZ_INDIA).format('DD-MMM-YYYY');
    let result = holidayList[currentDate] ? true:false;
    console.info("Is it NSE holiday? => ", result ? 'Yes' : 'No');
    return result;
}

function withinTradingHours() {
    let TRADING_STARTTIME = moment.utc().tz(appConfig.app.TZ_INDIA).startOf('date').set('hour', appConfig.tradeSchedule.start.hour).set('minute', appConfig.tradeSchedule.start.minute);
    let TRADING_ENDTIME = moment.utc().tz(appConfig.app.TZ_INDIA).startOf('date').set('hour', appConfig.tradeSchedule.end.hour).set('minute', appConfig.tradeSchedule.end.minute);
    //console.debug("Current server time ", (moment.utc().tz(appConfig.app.TZ_INDIA)));
    let after = (moment.utc().tz(appConfig.app.TZ_INDIA).isAfter(TRADING_STARTTIME));
    let before = (moment.utc().tz(appConfig.app.TZ_INDIA).isBefore(TRADING_ENDTIME));
    console.debug("Within the trading hours : ", (after && before));
    return (after && before);
}

function deploymentsFormattedText(data, tradeType, creatorId) {
    //Prepare the html data
    let formattedText = '';
    let total_pnl = 0;
    let total_capital = 0;
    data.forEach(deployment => { //Returns a Deployment object
        if (deployment.reportable({telegramCheck:true})) {
            formattedText += (deployment.toString() + appConfig.app.NEWLINE);
            total_pnl += deployment.getPNL();
            total_capital += deployment.getCapital();
        }
    });
    total_pnl = parseFloat(total_pnl).toFixed(2);
    roi = (total_pnl*100/total_capital).toFixed(2);
    roi = isNaN(roi) ? 0:roi;

    let summaryText = (total_pnl >= 0) ? appConfig.app.POSITIVE : appConfig.app.NEGATIVE;
    summaryText += ` ${tradeTypeObj[tradeType]} PNL • <b> ₹ ${total_pnl}</b> (${roi}%)${appConfig.app.NEWLINES}`;

    let footer = '';
    //Add footer text only for PT trades as these are done for Strategy owners
    if(tradeTypeObj[tradeType] == 'PT') {
        footer = `<i>${appConfig.app.NEWLINE} ${mapper?.[creatorId]?.strategy_owner || '🏁'} • ${getDateTimestamp()}</i>`;
    } else {
        footer = `<i>${appConfig.app.NEWLINE}${getDateTimestamp()}</i>`;
    }

    formattedText = summaryText + formattedText + footer;
    return formattedText;
}

function quoteFormattedText(quoteObj) {
    let message = `<b>${quoteObj.title}</b>
    <pre>"${quoteObj.quote}"</pre>
    <i>--${quoteObj.author}</i>
    <a href="${quoteObj.image}">&#8205;</a>`;

    return message;
}

module.exports = {
    getDatestamp,
    getRangeName,
    getTimestamp,
    getDateTimestamp,
    isHoliday,
    withinTradingHours,
    deploymentsFormattedText,
    quoteFormattedText
};