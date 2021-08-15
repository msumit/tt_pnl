/* Google service
Google sheet automation to add raw data
*/

const appConfig = require("../config");
const { getDatestamp, getRangeName, getTimestamp, getDateTimestamp } = require('../utils');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');
const utils = require('../utils');
//Global variable to keep the token, just before expiry we will refresh it to get new
let autoRefreshingTokens = null;

//Do once to create the JWT client on server start
const client = new JWT({
    email: appConfig.google.pkEmail,
    key: appConfig.google.pkpk,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

/*
    options : {gSheetId:gSheetId}
*/
let CreateSheet = async (options) => {
    autoRefreshingTokens = await client.authorize();
    const sheets = google.sheets('v4');

    //Get the sheet properties, we need the first sheetID only
    const sheetProperties = await sheets.spreadsheets.get({
        spreadsheetId: options.gSheetId,
        fields: "sheets.properties",
        auth: client
    });
    console.log(`CreateSheet() : Get all sheet properties fetched for ${options.gSheetId}`);

    let dateStamp = getDatestamp();
    //There is always a first sheet, so just take the id from it
    let sourceSheetId = sheetProperties.data.sheets[0].properties.sheetId;
    //Using the sheetID, we will duplicate it with a new name and give it index=0 so that it is the first tab
    let requests = [];
    requests.push({
        duplicateSheet: {
            insertSheetIndex: 0,
            newSheetName: dateStamp,
            sourceSheetId: sourceSheetId
        }
    });

    await sheets.spreadsheets.batchUpdate({
        auth: client,
        spreadsheetId: options.gSheetId,
        resource: { requests }
    });
    console.log(`CreateSheet() : Duplicate Sheet created with name ${dateStamp} in ${options.gSheetId}`);

    //Now that we have today's sheet copied, we will clear the cells.
    let rowIndex = options.rowIndex || 2; //Start clearing from row#2 as default.
    let rangeToBeCleared = `!${rowIndex}:1000`;// So, its either !2:1000 or !N:1000 based on the value of N. 1000 is a large row number just to be on the safe side
    await sheets.spreadsheets.values.clear({
        spreadsheetId: options.gSheetId,
        range: getRangeName(rangeToBeCleared),
        auth: client
    });

    console.log(`CreateSheet() : New Sheet has been cleared in ${options.gSheetId}`);

    return true;
}

/*
*/
let WriteData = async (strategies, gSheetId, timeStampType, updateTopSheetOnly) => {
    timeStampType = timeStampType || 'time'; //If nothing is passed then it is assumed as time
    updateTopSheetOnly = updateTopSheetOnly || false;
    let validTokens = false;
    if (autoRefreshingTokens) {
        let diff = autoRefreshingTokens.expiry_date - new Date().getTime();
        if (diff > 6 * 60 * 1000) { //if diff is less than 6 minutes
            validTokens = true;
        }
    }
    if (!validTokens) {
        console.log("GSheet WriteData() : Google Tokens have expired, fetching new tokens...");
        autoRefreshingTokens = await client.authorize();
    }

    let valueArray = new Array(strategies.length + 2).fill(0); //Left most is time and right most is Total
    valueArray[0] = (timeStampType == 'date') ? getDatestamp(): getTimestamp();//Time or date is pushed to the first column.
    let total_pnl = 0.0;
    strategies.forEach(deployment => {
        //Only report the Live or Exited PNL
        if ( deployment.reportable({}) ) {
            total_pnl += deployment.getPNL();
            valueArray[deployment.getIndex()] = deployment.getPNL();
        }
    });
    valueArray[strategies.length + 1] = total_pnl;//Total pnl is pushed to the last column

    const sheets = google.sheets('v4');
    let sheetRange = '!A1:1';
    let rangeName = updateTopSheetOnly ? sheetRange : getRangeName(sheetRange); //Take the top sheet or use the sheet with the range name
    try {
        const results = await sheets.spreadsheets.values.append({
            spreadsheetId: gSheetId,
            valueInputOption: "USER_ENTERED",
            range: rangeName,
            resource: { range: rangeName, majorDimension: "ROWS", values: [valueArray] },
            auth: client
        });
        return {status:true};
    } catch(e) {
        console.log(e.errors);
        return {status:false,message:e.message, gSheetId:gSheetId};
    }

    console.info(`Write Google Sheet() : ${gSheetId} Sheet updated with ticker data at ${getDateTimestamp()}`);

}

module.exports.CreateSheet = CreateSheet;
module.exports.WriteData = WriteData;

