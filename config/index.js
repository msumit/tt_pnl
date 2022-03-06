const dotenv = require('dotenv');
// config() will read your .env file, parse the contents, assign it to process.env.
dotenv.config();

module.exports = {
    port: process.env.PORT,
    tradetron: {
        cookie: `tradetron_session=${process.env.TT_COOKIE}`,
        watchlistId: process.env.WATCHLIST_ID
    },
    telegram: {
        debugChatId: process.env.TELEGRAM_CHAT_ID_DEBUG,
        botToken: process.env.TELEGRAM_BOT_TOKEN
    },
    google: {
        pkEmail: process.env.PK_EMAIL,
        pkpk: process.env.PK_PK.replace(/\\n/g, '\n'), //This is workaround to read the private key which already has \n in it.
        projectId: process.env.GOOGLE_PROJECT_ID,
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
        ZERO : '⚫️',
        BLOCKED :'🚧',
        TELEGRAM : 'Telegram',
        GSHEET : 'GSheet',
        TZ_INDIA : 'Asia/Kolkata',
        FORCE_WORKING : process.env.FORCE_WORKING,
        UP : '⬆️',
        DOWN : '⬇️'
    }
}