const appConfig = require("../config");

module.exports = class Deployment {
    constructor(type, id, status, pnl, currency, strategyName, creatorName) {
        this.type = type;
        this.id = id;
        this.status = status;
        this.pnl = parseFloat(parseFloat(pnl).toFixed(2)); //Convert the string pnl to float with 2 decimals and then to a float
        this.currency = currency;
        this.strategyName = strategyName;
        this.creatorName = creatorName;
    }

    /*
    Returns 🟢 <s>Apache // Bank Nifty</s> ₹ 606.25 or 🔴 Amogha // Nifty & Bank Nifty ₹ -100
    */
    toString = () => {
        let formattedMessage = this.pnl >= 0 ? appConfig.app.POSITIVE : appConfig.app.NEGATIVE;
        let formattedName = (this.status.search('Exited') >= 0) ? `<s>${this.getShortName()}</s>` : `${this.getShortName()}`; //Exited will have a strikethrough
        formattedMessage += ` ${formattedName} <b>${this.currency}${this.pnl}</b>`;
        return formattedMessage;
    }

    getPNL = () => {
        return this.pnl;
    }

    reportable = () => {
        return ((this.status.search('Live-Entered') >= 0) || (this.status.search('Exited') >= 0));
    }

    getShortName = () => {
        return this.strategyName.slice(0, this.strategyName.indexOf('/')).trim();
    }
}
