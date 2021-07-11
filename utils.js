const moment = require('moment-timezone');
const appConfig = require('./config');

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
    return today.format("DDMMMYYYY HH:mm").toString();
}

function isHoliday() {
    //Check if it is a weekend.
    let weekend = ((moment.utc().tz(appConfig.app.TZ_INDIA).day() % 6) == 0); //Sunday is 0 and Saturday is 6. 0%6 and 6%6 will be zero
    console.info("Is it Weekend? => ", weekend ? 'Yes' : 'No');
    if (weekend) return weekend;

    let currentDate = moment.utc().tz(appConfig.app.TZ_INDIA);
    let holidayArray = holidayList.FO.filter((dt) => {
        let holidayDate = moment.utc(new Date(dt.tradingDate)).tz(TZ_INDIA);
        return currentDate.isSame(holidayDate, 'day');
    });
    console.info("Is it NSE holiday? => ", (holidayArray.length > 0) ? 'Yes' : 'No');
    return (holidayArray.length > 0);
}

function withinTradingHours() {
    let TRADING_STARTTIME = moment.utc().tz(appConfig.app.TZ_INDIA).startOf('date').set('hour', appConfig.tradeSchedule.start.hour).set('minute', appConfig.tradeSchedule.start.minute);
    let TRADING_ENDTIME = moment.utc().tz(appConfig.app.TZ_INDIA).startOf('date').set('hour', appConfig.tradeSchedule.end.hour).set('minute', appConfig.tradeSchedule.end.minute);
    console.debug("Current server time ", (moment.utc().tz(appConfig.app.TZ_INDIA)));
    let after = (moment.utc().tz(appConfig.app.TZ_INDIA).isAfter(TRADING_STARTTIME));
    let before = (moment.utc().tz(appConfig.app.TZ_INDIA).isBefore(TRADING_ENDTIME));
    console.debug("Within the trading hours : ", (after && before));
    return (after && before);
}

module.exports = {
    getDatestamp,
    getRangeName,
    getTimestamp,
    getDateTimestamp,
    isHoliday,
    withinTradingHours
};