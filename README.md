# tt_pnl
RESTful apis to push TT updates to telegram and google sheet

## Prereqs
* Nodejs = `v14.2.0`
* Setup a telegram bot, keep its token handy. Add it to group for local testing
* Setup a google project

## Create .env with this content

```
PORT=3000
TT_COOKIE= //add the TT cookie, get it by inspecting TT's calls and extract the TT session data : manual step, may be needed everyday
TRADE_TYPE= //Use either `LIVE AUTO` or `PAPER TRADING`
TELEGRAM_CHAT_ID= //Once you have added the bot to your group, send a sample message from the group, use the getUpdates call to extract the chat id from the json response. One time job
TELEGRAM_BOT_TOKEN= //You get this when you set up your bot using BotFather
TELEGRAM_CHAT_ID_DEBUG= //As a developer, you may want to get internal news of the app or failure, like session expiry or Google sheet misbehaving
PK_EMAIL= //Google gives a service based email which can make modifications to your sheet
PK_PK= //private key when you setup the Google project
GOOGLE_PROJECT_ID= //Google project id
TRADE_START_HOUR= //Usually 9
TRADE_START_MIN= //Usually 14
TRADE_END_HOUR= //Usually 15
TRADE_END_MIN= //Usually 16
APIUSER= //Super secret username to be used when making api calls
APIPWD= //Super secret password to be used when making api calls
```

## Secret sauce in mapping.json
TT returns the deployments in its own order. The web api doesnot have any sort order support. The strategies may have really long name. This mapping helps to get a shortname as well as an index.

## APIs

### Token expiry check to be done once a day
```
curl --location --request POST 'http://localhost:3000/tokenTest' \
--header 'Authorization: Basic xxx' \
--header 'Content-Type: application/json' \
--data-raw '{
    "tradeType": "LIVE AUTO",
    "creatorId": ""
}'
```

### Setup a fresh google sheet everyday day once
```
curl --location --request POST 'http://localhost:3000/tt-daySetup' \
--header 'Authorization: Basic xxx' \
--header 'Content-Type: application/json' \
--data-raw '{
    "gSheetId": "xxxxxxxxxxxxxxxxxxx"
}'
```

### Send a formatted HTML message Telegram chat
```
curl --location --request POST 'http://localhost:3000/pnl-telegram' \
--header 'Authorization: Basic xxx' \
--header 'Content-Type: application/json' \
--data-raw '{
    "tradeType": "LIVE AUTO",
    "creatorId": "111111111",
    "telegramChatId": "1111111111"
}'
```

### Update Google sheet
```
curl --location --request POST 'http://localhost:3000/pnl-gsheet' \
--header 'Authorization: Basic xxx' \
--header 'Content-Type: application/json' \
--data-raw '{
    "tradeType": "PAPER TRADING",
    "creatorId": "11111111",
    "telegramChatId": "11111111",
    "gSheetId": "xxxxxxxxxxxxxxxxxxx"
}'
```

### Get daily motivation quotes
```
curl --location --request POST 'http://localhost:3000/qod-telegram' \
--header 'Authorization: Basic xxx' \
--header 'Content-Type: application/json' \
--data-raw '{
    "telegramChatId":"1111111111"
}'
```

## Deploy
Use Qovery service. Easy to learn and quick to deploy.
With v2, it has become even more simple. Once you create your project > environment > app, simply git push for the app to update and get redeployed.
Remember to update the envs beforehand. I have created them as Project env vars so that other apps can easily inherit them and then can be overwritten per env or app 
