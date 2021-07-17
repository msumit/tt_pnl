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

/*
    options : {debug:true/false optional, message:your-message}
*/
async function SendMessage(options) {
    let isDebug = options.debug ? true:false;
    if(isDebug) options.message = "Hostname:" + os.hostname() + " " + options.message;
    let url = TELEGRAM_POST_URL;
    let chatId = isDebug ? appConfig.telegram.debugChatId : options.chatId;
    url.searchParams.append("chat_id", chatId);

    url.searchParams.append("text", options.message);
    fetch(url, { method: 'POST' });
    console.log(`Telegram message for chat ${chatId} sent to users at ${utils.getDateTimestamp()}`);
}

module.exports.SendMessage = SendMessage;

