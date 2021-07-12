/* Google service
Google sheet automation to add raw data
*/

const appConfig = require("../config");
const { getDatestamp, getRangeName, getTimestamp, getDateTimestamp } = require('../utils');
const { JWT } = require('google-auth-library');
const { google } = require('googleapis');
//Global variable to keep the token, just before expiry we will refresh it to get new
let autoRefreshingTokens = null;

//Do once to create the JWT client on server start
const client = new JWT({
    email: appConfig.google.pkEmail,
    key: appConfig.google.pkpk,
    scopes: ['https://www.googleapis.com/auth/spreadsheets']
});

/*
    options : {}
*/
let CreateSheet = async (options) => {
    autoRefreshingTokens = await client.authorize();
    const sheets = google.sheets('v4');

    //Get the sheet properties, we need the first sheetID only
    const sheetProperties = await sheets.spreadsheets.get({
        spreadsheetId: appConfig.google.spreadsheetId,
        fields: "sheets.properties",
        auth: client
    });
    console.log("CreateSheet() : Get all sheet properties fetched");

    //There is always a first sheet, so just take the id from it
    let sourceSheetId = sheetProperties.data.sheets[0].properties.sheetId;
    //Using the sheetID, we will duplicate it with a new name and give it index=0 so that it is the first tab
    let requests = [];
    requests.push({
        duplicateSheet: {
            insertSheetIndex: 0,
            newSheetName: getDatestamp(),
            sourceSheetId: sourceSheetId
        }
    });

    await sheets.spreadsheets.batchUpdate({
        auth: client,
        spreadsheetId: appConfig.google.spreadsheetId,
        resource: { requests }
    });
    console.log("CreateSheet() : Duplicate Sheet created with name ", getDatestamp());

    //Now that we have today's sheet copied, we will clear the cells.
    await sheets.spreadsheets.values.clear({
        spreadsheetId: appConfig.google.spreadsheetId,
        range: getRangeName(appConfig.app.SHEET_CLEAR_RANGE),
        auth: client
    });
    console.log("CreateSheet() : New Sheet has been cleared");
    return true;
}

/*
*/
let WriteData = async (strategies) => {
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

    let valueArray = new Array(appConfig.app.HEADER_ROW_DATA.length).fill(0);
    valueArray[0] = getTimestamp();//Time is pushed to the first column.
    let total_pnl = 0.0;
    strategies.forEach(deployment => {
        //Only report the Live or Exited PNL
        if ( deployment.reportable() ) {
            total_pnl += deployment.getPNL();

            //pruning only the strategy name by removing anything after //
            let name = deployment.getShortName();
            valueArray[appConfig.app.HEADER_ROW_DATA.indexOf(name)] = deployment.getPNL();
        }
    });
    valueArray[appConfig.app.HEADER_ROW_DATA.length - 1] = total_pnl;//Total pnl is pushed to the last column

    const sheets = google.sheets('v4');
    let rangeName = getRangeName(appConfig.app.SHEET_RANGE);
    const results = await sheets.spreadsheets.values.append({
        spreadsheetId: appConfig.google.spreadsheetId,
        valueInputOption: "USER_ENTERED",
        range: rangeName,
        resource: { range: rangeName, majorDimension: "ROWS", values: [valueArray] },
        auth: client
    });
    console.info("Write Google Sheet() : Sheet updated with ticker data at ", getDateTimestamp());

}

module.exports.CreateSheet = CreateSheet;
module.exports.WriteData = WriteData;

