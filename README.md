# tt_pnl
Periodic check for TT PNL

## Prereqs
* Nodejs = `v14.2.0`
* Setup a telegram bot, keep its token handy. Add it to group for local testing

## create .env
```
NODE_ENV=development
PORT=3000
TT_COOKIE=
TRADE_TYPE=PAPER TRADING
TELEGRAM_CHAT_ID=
TELEGRAM_BOT_TOKEN=
CRONEXP=* * * * *
TELEGRAM_CHAT_ID_DEBUG=
```

## Deploy
I have used Qovery service. Learnt it in 10mins as it super simple. The .qovery.yml file is self descriptive
