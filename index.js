const express = require('express');
const moment = require('moment-timezone');
let holidayList = require('./foHolidays.json');
const TZ_INDIA = "Asia/Kolkata";
const ttService = require("./service/TradetronService");
const publisherService = require("./service/PublisherService");
const gSheetService = require("./service/GoogleService");
const appConfig = require("./config");
const utils = require('./utils');


var app = express();


console.info("START : Application fully loaded");

//Compute holiday checker once a day or on server restart and is cached
let isTodayHoliday = utils.isHoliday();

if (isTodayHoliday) {
    console.info("Its is a holiday, so lets hope no workers work today");
}

//Middleware to check auth
let authorizedMW = (req, res, next) => {
    if (req.headers.authorization) {
        const base64Credentials = req.headers.authorization.split(' ')[1];
        const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
        const [username, password] = credentials.split(':');
        if (username === appConfig.app.API_USER && password === appConfig.app.API_PWD) {
            return next()
        }
    }

    return res.status(401).json({ status: 'Unauthorized', message: 'Not authorized to access this api' });
}

//Middleware to check holiday and trade working hours
let tradeTimeCheckerMW = (req, res, next) => {
    if (isTodayHoliday && !utils.withinTradingHours()) {
        return res.status(200).send({ status: 'Not processed', message: `Request in holiday or outside trade window` });
    }
    next()
}

//Routes with middlewares
app.post('/pnl-telegram', authorizedMW, tradeTimeCheckerMW,
    async (req, res, next) => {
        ttService.Deployments().then(result => {
            publisherService.Publish({ transporter: appConfig.app.TELEGRAM, data: result });
        }).catch(e => {
            console.log(e);
            publisherService.Publish({ debug: true, transporter: appConfig.app.TELEGRAM, message: e.message });
        });

        res.json({ status: 'Ok', message: `PNL request is accepted at ${new Date().toString()}` });
    });

app.post('/pnl-gsheet', authorizedMW, tradeTimeCheckerMW,
    async (req, res, next) => {
        ttService.Deployments().then(result => {
            publisherService.Publish({ transporter: appConfig.app.GSHEET, data: result });
        }).catch(e => {
            console.log(e.message);
            publisherService.Publish({ debug: true, transporter: appConfig.app.TELEGRAM, message: e.message });
        });

        res.json({ status: 'Ok', message: `Google Sheet update request is accepted at ${new Date().toString()}` });
    });

app.post('/tt-daySetup', authorizedMW,
    async (req, res, next) => {
        //One time setup, this should be called everyday once.
        isTodayHoliday = utils.isHoliday();

        //Create the google sheet for today
        gSheetService.CreateSheet().then(result => {
            publisherService.Publish({ debug: true, transporter: appConfig.app.TELEGRAM, message: 'Sheet creation successful' });
        }).catch(e => {
            console.log(e.message);
            publisherService.Publish({ debug: true, transporter: appConfig.app.TELEGRAM, message: e.message });
        });

        return res.json({ status: 'Ok', message: `Google sheet init is accepted at ${utils.getDateTimestamp()}` });
    });

app.post('/tokenTest', authorizedMW,
    async (req, res, next) => {
        //Test call to get all deployments
        ttService.Deployments().then(result => {
            return res.status(200).send({ status: 'Ok', message: `TT Token is working at ${utils.getDateTimestamp()}` });
        }).catch(e => {
            console.log(e.message);
            publisherService.Publish({ debug: true, transporter: appConfig.app.TELEGRAM, message: e.message });
            return res.status(401).send({ status: 'Not Ok', message: e.message });
        });
    });

app.listen(process.env.PORT);
