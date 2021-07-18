const { app } = require("../config");
const appConfig = require("../config");
const telegramService = require("./TelegramService");
const googleService = require("./GoogleService");

/* Publisher service
Send formatted messages to consumers 
*/

/* Function Publish
@param transporter type, message or data and chatId ( optional )
*/
async function Publish(options) {
    if(options.transporter == appConfig.app.TELEGRAM) {
        sendToTelegram(options);
    } else if(options.transporter == appConfig.app.GSHEET) {
        sendToGoogle(options);
    }
}

function sendToTelegram(options) {
    telegramService.SendMessage({debug:options.debug, message:options.message, chatId:options.chatId});
}

function sendToGoogle(options) {
    googleService.WriteData(options.data, options.gSheetId);
}

module.exports.Publish = Publish;