const mapper = require("../mapping.json");

module.exports = class Strategy {
    constructor(strategyId, creatorId) {
        this.strategyId = strategyId;
        this.creatorId = creatorId;
    }
    isPositionalStrategy = () => {
        return mapper?.[this.creatorId]?.[this.strategyId]?.kindOf || false;
    }
}
