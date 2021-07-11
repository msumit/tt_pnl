const appConfig = require("../config");
const fetch = require('node-fetch');
const Deployment = require("../model/Deployment");

/* Tradetron service
Wrappers on api calls to get the deployment values
*/


const TT_URL = new URL('https://tradetron.tech/api/deployed-strategies');
TT_URL.searchParams.append("execution", appConfig.tradetron.tradeType);
TT_URL.searchParams.append("creator_id", appConfig.tradetron.creatorId);

const options = {
    headers: {
        'Accept': 'application/json',
        'x-requested-with': 'XMLHttpRequest',
        'cookie': appConfig.tradetron.cookie
    }
}

async function Deployments() {
    const res = await fetch(TT_URL.href, options);
    if (res.ok) {
        //Simplify the deployment json as Deployment Objects Array
        let deployments = await res.json();
        let deploymentsArray = [];
        deployments.data.forEach(element => {
            deploymentsArray.push(
                new Deployment(element.deployment_type, 
                    element.id, 
                    element.status, 
                    element.sum_of_pnl, 
                    element.currency, 
                    element.template.name, 
                    element.template.user.name));

        });
        return deploymentsArray;
    } else {
        throw new Error('TT Api Authentication Problem');
    }
}

module.exports.Deployments = Deployments;