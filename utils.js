const moment = require('moment-timezone');
const appConfig = require('./config');
let holidayList = require('./foHolidays.json');
const tradeTypeObj = {"LIVE AUTO":"LA", "PAPER TRADING" : "PT"}; 

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
    let weekend = ((moment.utc().tz(appConfig.app.TZ_INDIA).day() % 6) == 0); //Sunday is 0 and Saturday is 6. 0%6 and 6%6 will be zero
    console.info("Is it Weekend? => ", weekend ? 'Yes' : 'No');
    if (weekend) return weekend;

    let currentDate = moment.utc().tz(appConfig.app.TZ_INDIA);
    let holidayArray = holidayList.FO.filter((dt) => {
        let holidayDate = moment.utc(new Date(dt.tradingDate)).tz(appConfig.app.TZ_INDIA);
        return currentDate.isSame(holidayDate, 'day');
    });
    console.info("Is it NSE holiday? => ", (holidayArray.length > 0) ? 'Yes' : 'No');
    return (holidayArray.length > 0);
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

function deploymentsFormattedText(data, tradeType) {
    //Prepare the html data
    let formattedText = '';
    let total_pnl = 0;
    data.forEach(deployment => { //Returns a Deployment object
        if (deployment.reportable()) {
            formattedText += (deployment.toString() + appConfig.app.NEWLINE);
            total_pnl += deployment.getPNL();
        }
    });
    total_pnl = parseFloat(total_pnl).toFixed(2);
    let summaryText = (total_pnl >= 0) ? appConfig.app.POSITIVE : appConfig.app.NEGATIVE;
    summaryText += ` ${tradeTypeObj[tradeType]} PNL = <b> ₹ ${total_pnl} </b>${appConfig.app.NEWLINES}`;

    formattedText = summaryText + formattedText;
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