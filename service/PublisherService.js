const { app } = require("../config");
const appConfig = require("../config");
const telegramService = require("./TelegramService");
const googleService = require("./GoogleService");
const tradeTypeObj = {"LIVE AUTO":"LA", "PAPER TRADING" : "PT"}; 

/* Publisher service
Send formatted messages to consumers 
*/

/* Function Publish
@param transporter type, array of deployment
*/
async function Publish(options) {
    if(options.debug && options.transporter == appConfig.app.TELEGRAM) {
        sendToTelegram2({debug:true, message: options.message});
    } else if(options.transporter == appConfig.app.TELEGRAM) {
        sendToTelegram(options.data, options.tradeType, options.chatId);
    } else if(options.transporter == appConfig.app.GSHEET) {
        sendToGoogle(options);
    }
}

function sendToTelegram(data, tradeType, chatId) {
    //Prepare the html data
    let formattedText = '';
    let total_pnl = 0;
    data.forEach(deployment => {
        if (deployment.reportable()) {
            formattedText += (deployment.toString() + appConfig.app.NEWLINE);
            total_pnl += deployment.getPNL();
        }
    });
    total_pnl = parseFloat(total_pnl).toFixed(2);
    let summaryText = (total_pnl >= 0) ? appConfig.app.POSITIVE: appConfig.app.NEGATIVE; 
    summaryText += ` ${tradeTypeObj[tradeType]} PNL = <b> ₹ ${total_pnl} </b>${appConfig.app.NEWLINES}`;

    formattedText = summaryText + formattedText;
    telegramService.SendMessage({message:formattedText, chatId:chatId});
}

function sendToTelegram2(options) {
    telegramService.SendMessage({debug: options.debug, message:options.message});
}

function sendToGoogle(options) {
    googleService.WriteData(options.data, options.gSheetId);
}

module.exports.Publish = Publish;