const appConfig = require("../config");
const fetch = require('node-fetch');
const utils = require("../utils");

/* Telegram service
Send message to Telegram
*/

const TELEGRAM_POST_URL = new URL('https://api.telegram.org/bot' + appConfig.telegram.botToken + '/sendMessage');
TELEGRAM_POST_URL.searchParams.append("parse_mode", "HTML");
TELEGRAM_POST_URL.searchParams.append("disable_web_page_preview", false);

/*
    options : {debug:true/false optional, message:your-message}
*/
async function SendMessage(options) {
    let isDebug = options.chatId == appConfig.telegram.debugChatId; //Debug mode

    if(isDebug) options.message = '🔥 ' + options.message;

    let url = new URL(TELEGRAM_POST_URL.toString()); //a new copy
    url.searchParams.append("chat_id", options.chatId);
    url.searchParams.append("text", options.message);
    
    fetch(url, { method: 'POST' });
    console.log(`Telegram message for chat ${options.chatId} sent to users at ${utils.getDateTimestamp()}`);
}

module.exports.SendMessage = SendMessage;

