const appConfig = require("../config");
const mapper = require("../mapping.json");

module.exports = class Deployment {
    constructor(type, id, status, pnl, currency, strategyId, strategyName, creatorName, creatorId, capitalRequired) {
        let num_pnl = Math.round(pnl);
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
        this.capitalRequired = capitalRequired;
    }

    /*
    Returns 🟢 <s>Apache // Bank Nifty</s> ₹ 606.25 or 🔴 Amogha // Nifty & Bank Nifty ₹ -100
    */
    toString = () => {
        let formattedMessage = this.pnl >= 0 ? appConfig.app.POSITIVE : appConfig.app.NEGATIVE;
        let formattedName = (this.status.search('Exited') >= 0) ? `<s>${this.getShortName()}</s>` : `${this.getShortName()}`; //Exited will have a strikethrough
        formattedMessage += ` ${formattedName} <b>${this.currency}${this.pnl}</b>`;
        formattedMessage += ` (${(this.pnl*100/this.capitalRequired).toFixed(2)}%)`
        
        return formattedMessage;
    }

    getPNL = () => {
        return this.pnl;
    }

/* options will have telegramCheck as true or false */    
    reportable = (options) => {
        //Earlier we were checking the status. But with the new roll up of positions, we can ignore the state check
        //((this.status.search('Live-Entered') >= 0) || (this.status.search('Exited') >= 0));

        //If the check is being requested, look for telegram_blocked flag. If telegram_blocked flag is absent then it means it can be reported.
        //Right now no check for google sheet, everything in mapper will be sent to google sheet.
        if ( !!options.telegramCheck ) {
            let isTelBlocked = mapper?.[this.creatorId]?.[this.strategyId]?.telegram_blocked || false;
            return !isTelBlocked;
        }

        return true;
    }

    getShortName = () => {
        return mapper?.[this.creatorId]?.[this.strategyId]?.name || this.strategyName;
    }

    getIndex = () => {
        return mapper?.[this.creatorId]?.[this.strategyId]?.index || "-1";
    }

    getCapital = () => {
        return this.capitalRequired;
    }
}
