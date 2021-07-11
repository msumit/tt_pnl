const { app } = require("../config");
const appConfig = require("../config");
const telegramService = require("./TelegramService");
const googleService = require("./GoogleService");

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
        sendToTelegram(options.data);
    } else if(options.transporter == appConfig.app.GSHEET) {
        sendToGoogle(options.data);
    }
}

function sendToTelegram(data) {
    //Prepare the html data
    let header = `<b>💰 PNL - </b> ${appConfig.tradetron.tradeType} 💰 ${appConfig.app.NEWLINES}`;
    let formattedText = header;
    let total_pnl = 0;
    data.forEach(deployment => {
        if (deployment.reportable()) {
            formattedText += (deployment.toString() + appConfig.app.NEWLINE);
            total_pnl += deployment.getPNL();
        }
    });
    formattedText += appConfig.app.NEWLINE;
    formattedText += (total_pnl >= 0) ? appConfig.app.POSITIVE: appConfig.app.NEGATIVE;
    formattedText += ` TOTAL PNL = <b> ₹ ${total_pnl} </b>`;
    telegramService.SendMessage({message:formattedText});
}

function sendToTelegram2(options) {
    telegramService.SendMessage({debug: options.debug, message:options.message});
}

function sendToGoogle(data) {
    googleService.WriteData(data);
}

module.exports.Publish = Publish;