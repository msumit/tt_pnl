const express = require('express');
const ttService = require("./service/TradetronService");
const publisherService = require("./service/PublisherService");
const gSheetService = require("./service/GoogleService");
const appConfig = require("./config");
const utils = require('./utils');

let app = express();
app.use(express.json()); //to parse body

console.info(`START : Application fully loaded at ${utils.getDateTimestamp()}`);

//Compute holiday checker once a day or on server restart and is cached
let isTodayHoliday = utils.isHoliday();

if (isTodayHoliday) {
    console.info("Its is a holiday, so lets hope no workers work today");
}

//Middleware to log the request
let requestMW = (req, res, next) => {
    console.log(`Incoming request ${req.path} from ${req.hostname} at ${utils.getDateTimestamp()}`);
    next();
}

app.use(requestMW);

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
    if (!isTodayHoliday && utils.withinTradingHours()) {
        return next()
    }
    return res.status(200).send({ status: 'Not processed', message: `Request in holiday or outside trade window` });
}

let bodyCheckerMW = (req, res, next) => {
    let body = req.body;
    if( (body.tradeType != undefined) && (body.creatorId !=undefined)) {
        return next();
    }

    return res.status(400).send({ status: 'Incomplete request. Pass trade Type and creator ID'});
}

let bodyChecker2MW = (req, res, next) => {
    let body = req.body;
    if( body.gSheetId != undefined) {
        return next();
    }

    return res.status(400).send({ status: 'Incomplete request. Pass spreadsheet ID'});
}


//Routes with middlewares

    app.post('/pnl-telegram', authorizedMW, tradeTimeCheckerMW, bodyCheckerMW,
    async (req, res) => {
        const {tradeType, creatorId, telegramChatId} = req.body;
        ttService.Deployments({tradeType, creatorId}).then(result => {
            publisherService.Publish({ transporter: appConfig.app.TELEGRAM, data: result, tradeType: tradeType, chatId:telegramChatId });
        }).catch(e => {
            console.log(e);
            publisherService.Publish({ debug: true, transporter: appConfig.app.TELEGRAM, message: e.message });
        });

        res.json({ status: 'Ok', message: `PNL request is accepted at ${new Date().toString()}` });
    });

    app.post('/pnl-gsheet', authorizedMW, tradeTimeCheckerMW, bodyCheckerMW, bodyChecker2MW,
    async (req, res, next) => {
        const {tradeType, creatorId, gSheetId} = req.body;
        ttService.Deployments({tradeType, creatorId}).then(result => {
            publisherService.Publish({ transporter: appConfig.app.GSHEET, data: result, gSheetId:gSheetId });
        }).catch(e => {
            console.log(e.message);
            publisherService.Publish({ debug: true, transporter: appConfig.app.TELEGRAM, message: e.message });
        });

        res.json({ status: 'Ok', message: `Google Sheet update request is accepted at ${utils.getDateTimestamp()}` });
    });

    app.post('/tt-daySetup', authorizedMW, bodyChecker2MW,
    async (req, res, next) => {
        //One time setup, this should be called everyday once.
        isTodayHoliday = utils.isHoliday();

        //Create the google sheet for today
        const {gSheetId} = req.body;
        gSheetService.CreateSheet({gSheetId:gSheetId}).then(result => {
            publisherService.Publish({ debug: true, transporter: appConfig.app.TELEGRAM, message: `Daily Sheet creation successful for ${gSheetId}` });
        }).catch(e => {
            console.log(e.message);
            publisherService.Publish({ debug: true, transporter: appConfig.app.TELEGRAM, message: e.message });
        });

        return res.json({ status: 'Ok', message: `Google sheet init is accepted at ${utils.getDateTimestamp()}` });
    });

    app.post('/tokenTest', authorizedMW, bodyCheckerMW,
    async (req, res, next) => {
        //Test call to get all deployments
        const {tradeType, creatorId} = req.body;
        ttService.Deployments({tradeType, creatorId}).then(result => {
            return res.status(200).send({ status: 'Ok', message: `TT Token is working at ${utils.getDateTimestamp()}` });
        }).catch(e => {
            console.log(e.message);
            publisherService.Publish({ debug: true, transporter: appConfig.app.TELEGRAM, message: e.message });
            return res.status(401).send({ status: 'Not Ok', message: e.message });
        });
    });

app.listen(process.env.PORT);
