const appConfig = require("../config");
const fetch = require('node-fetch');
const os = require("os");
const utils = require("../utils");

/* Telegram service
Send message to Telegram
*/

//Real users
const TELEGRAM_POST_URL = new URL('https://api.telegram.org/bot' + appConfig.telegram.botToken + '/sendMessage');
TELEGRAM_POST_URL.searchParams.append("parse_mode", "HTML");

//Debug console to see the health of the services
const TELEGRAM_DEBUG_URL = new URL('https://api.telegram.org/bot' + appConfig.telegram.botToken + '/sendMessage');
TELEGRAM_DEBUG_URL.searchParams.append("chat_id", appConfig.telegram.debugChatId);

/*
    options : {debug:true/false optional, message:your-message}
*/
async function SendMessage(options) {
    let isDebug = options.debug ? true:false;
    if(isDebug) options.message = "Hostname:" + os.hostname() + " " + options.message;
    let liveUrl = new URL(TELEGRAM_POST_URL.toString());
    liveUrl.searchParams.append("chat_id", options.chatId);

    let url = new URL(isDebug ? TELEGRAM_DEBUG_URL.toString():liveUrl.toString());

    url.searchParams.append("text", options.message);
    fetch(url, { method: 'POST' });
    console.log(`Telegram message for chat ${options.chatId} sent to users at ${utils.getDateTimestamp()}`);
}

module.exports.SendMessage = SendMessage;

