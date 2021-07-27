const appConfig = require("../config");
const fetch = require('node-fetch');
const Deployment = require("../model/Deployment");

/* Tradetron service
Wrappers on api calls to get the deployment values
*/


const TT_URL = 'https://tradetron.tech/api/deployed-strategies';
const TT_URL2 = 'https://tradetron.tech/api/deployed/margin';

const options = {
    headers: {
        'Accept': 'application/json',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': appConfig.tradetron.cookie
    }
}

async function Deployments(tradeOptions) {
    const {tradeType, creatorId} = tradeOptions;
    let url = new URL(TT_URL);
    let url2 = new URL(TT_URL2);
    url.searchParams.append("execution", tradeType);
    url.searchParams.append("creator_id", creatorId);
    url2.searchParams.append("execution", tradeType);
    url2.searchParams.append("creator_id", creatorId);
    
    let [result1, result2] = await Promise.all([fetch(url.href, options), fetch(url2.href, options)]);

    if (result1.ok && result2.ok) {
        let deployments = await result1.json();
        let positions = await result2.json();
        //Every position will have a strategy id, thus we need to be reduce to reverse the object. We need total pnl of all positions per strategy
        cpos = positions?.data?.combined_position || [];
        let npos = cpos.reduce((result, currentValue) => {
            result[currentValue.strategy_id] = result[currentValue.strategy_id] || 0.0;
            result[currentValue.strategy_id] += parseFloat(currentValue.pnl);
            return result;
        }, {}); //{} is the starting empty object

        let deploymentsArray = [];
        deployments.data.forEach(element => {
            deploymentsArray.push(
                new Deployment(element.deployment_type,
                    element.id,
                    element.status,
                    npos[element.id], //pick up the value from the calculated sum from above
                    element.currency,
                    element.template.id,
                    element.template.name,
                    element.template.user.name,
                    element.template.user.id,
                    element.template.capital_required));
        });
        return deploymentsArray;
    } else {
        throw new Error('TT Api Authentication Problem');
    }
}

module.exports.Deployments = Deployments;