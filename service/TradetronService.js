const appConfig = require("../config");
const fetch = require('node-fetch');
const Deployment = require("../model/Deployment");

/* Tradetron service
Wrappers on api calls to get the deployment values
*/


const TT_URL = 'https://tradetron.tech/api/deployed-strategies';

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
    url.searchParams.append("execution", tradeType);
    url.searchParams.append("creator_id", creatorId);

    const res = await fetch(url.href, options);
    //This will get this is in the order in the mapping but creates issue with multiple or newly added strategies.
    //TODO: Get a better fix
    // if (res.ok) {
    //     //Simplify the deployment json as Deployment Objects Array
    //     let deployments = await res.json();
    //     let deploymentsArray = new Array(deployments.data.length);
    //     deployments.data.forEach(element => {
    //         let deploymentElement = new Deployment(element.deployment_type, 
    //             element.id, 
    //             element.status, 
    //             element.sum_of_pnl, 
    //             element.currency,
    //             element.template.id, 
    //             element.template.name, 
    //             element.template.user.name,
    //             element.template.user.id);
    //         deploymentsArray[deploymentElement.getIndex() - 1] = deploymentElement;
    //     });
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
                    element.template.id, 
                    element.template.name, 
                    element.template.user.name,
                    element.template.user.id));
        });

        return deploymentsArray;
    } else {
        throw new Error('TT Api Authentication Problem');
    }
}

module.exports.Deployments = Deployments;