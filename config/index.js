const dotenv = require('dotenv');
// config() will read your .env file, parse the contents, assign it to process.env.
dotenv.config();

module.exports = {
    port: process.env.PORT,
    tradetron: {
        creatorId: process.env.TT_CREATOR_ID,
        cookie: process.env.TT_COOKIE,
        tradeType: process.env.TRADE_TYPE
    },
    telegram: {
        chatId: process.env.TELEGRAM_CHAT_ID,
        debugChatId: process.env.TELEGRAM_CHAT_ID_DEBUG,
        botToken: process.env.TELEGRAM_BOT_TOKEN
    },
    google: {
        pkEmail: process.env.PK_EMAIL,
        pkpk: process.env.PK_PK.replace(/\\n/g, '\n'), //This is workaround to read the private key which already has \n in it.
        projectId: process.env.GOOGLE_PROJECT_ID,
        spreadsheetId: process.env.GSHEET_ID
    },
    tradeSchedule: {
        start: { 
            hour: process.env.TRADE_START_HOUR, 
            minute: process.env.TRADE_START_MIN 
        },
        end: { 
            hour: process.env.TRADE_END_HOUR, 
            minute: process.env.TRADE_END_MIN 
        }
    },
    app: {
        API_USER : process.env.APIUSER,
        API_PWD : process.env.APIPWD,
        NEWLINE : '\r\n',
        NEWLINES : '\r\n\r\n',
        POSITIVE :'🟢',
        NEGATIVE :'🔴',
        TELEGRAM : 'Telegram',
        GSHEET : 'GSheet',
        TZ_INDIA : 'Asia/Kolkata',
        HEADER_ROW_DATA : ['Time', 'Apache', 'Brahmos', 'Falcon', 'Amogha', 'Shaurya', 'Total'], // This will be injected to a fresh google sheet on its creation
        SHEET_RANGE : '!A1:G1', //Represents the above 7 cells 
        SHEET_CLEAR_RANGE : '!A2:Z1000' //Choose all cells except the header

    }
}