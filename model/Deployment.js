const appConfig = require("../config");
const mapper = require("../mapping.json");

module.exports = class Deployment {
    constructor(type, id, status, pnl, currency, strategyId, strategyName, creatorName, creatorId) {
        let num_pnl = parseFloat(parseFloat(pnl).toFixed(2));//Convert the string pnl to float with 2 decimals and then to a float
        num_pnl = (isNaN(num_pnl) ? 0 : num_pnl);
        this.type = type;
        this.id = id;
        this.status = status;
        this.pnl = num_pnl;
        this.currency = currency;
        this.strategyId = strategyId;
        this.strategyName = strategyName;
        this.creatorName = creatorName;
        this.creatorId = creatorId;
    }

    /*
    Returns 🟢 <s>Apache // Bank Nifty</s> ₹ 606.25 or 🔴 Amogha // Nifty & Bank Nifty ₹ -100
    */
    toString = () => {
        let formattedMessage = this.pnl >= 0 ? appConfig.app.POSITIVE : appConfig.app.NEGATIVE;
        let formattedName = (this.status.search('Exited') >= 0) ? `<s>${this.getShortName()}</s>` : `${this.getShortName()}`; //Exited will have a strikethrough
        formattedMessage += ` ${formattedName} = <b>${this.currency}${this.pnl}</b>`;
        return formattedMessage;
    }

    getPNL = () => {
        return (isNaN(this.pnl) ? 0 : this.pnl);
    }

    reportable = () => {
        return ((this.status.search('Live-Entered') >= 0) || (this.status.search('Exited') >= 0));
    }

    getShortName = () => {
        return mapper?.[this.creatorId]?.[this.strategyId]?.name || this.strategyName;
    }

    getIndex = () => {
        return mapper?.[this.creatorId]?.[this.strategyId]?.index || "-1";
    }
}
