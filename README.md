# Fitbit-Telegram bridge

![image](https://s3.eu-west-1.amazonaws.com/fitbit-telegram-bridge/ressources/IMG_2506.PNG)

This is a project that allows you to log food on Fitbit by sending messages to a Telegram bot.

You can use my existing Bot or use the code in this repository to create your own Bot & backend

## Map Telegram messages to Fitbit Food logs

The Bot uses a .js file to map telegram messages to foodlogs.

It has a basic config in German for my own use. If you want to extend it you can submit a Pull Request or fork the project and create your own backend incl. configuration

There are 2 types of matching the bot can do

#### Simple matching

```
{
    meta: [/^joghurt$/i, Actions.LOG_FOOD, 'Joghurt'],
    getLogSpecifics: () => (
      [
        [300, FitBitFoodIds.Joghurt.Plain.DEFAULT],
        [100, FitBitFoodIds.Joghurt.Fruit.DEFAULT],
        [40, FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
}
```

This would match the message `joghurt` and log 300g of Plain Joghurt, 100g of Fruit Joghurt and 40g of Muesli


#### Dynamic values: Regex with groups

```
{
    meta: [/^joghurt (\d+) (\d+) (\d+)$/i, Actions.LOG_FOOD, 'Joghurt with weights'],
    getLogSpecifics: matchResult => (
      [
        [Number.parseInt(matchResult[1], 10), FitBitFoodIds.Joghurt.Plain.DEFAULT],
        [Number.parseInt(matchResult[2], 10), FitBitFoodIds.Joghurt.Fruit.DEFAULT],
        [Number.parseInt(matchResult[3], 10), FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
}
```

This would match the message `joghurt 400 150 30` and log 400g of Plain Joghurt, 150g of Fruit Joghurt and 30g of Muesli 

## Use existing Bot

### Connection Fitbit and Telegram

1. Find `@FitbitFoodLoggerBot` on Telegram
2. Message `init` to the bot
3. Click the link the Bot sends you -> You will be forwarded to fitbit
4. Login to Fitbit and grant the bot permission to access your nutrition data
5. You will be redirected to an empty page. If the page displays "Success" you are good to go.

Neither the bot nor I get access to your password or any data besides your food log. You can revoke the access token that allows the bot to log to Fitbit in your name at any in your fitbit.com settings

### Adding Food & Calories

If you tell the bot to log food, it will add the food / calories to your personal food log.

#### Deploy with CDK
#### Update redirect url on https://dev.fitbit.com/apps/new
#### Update webhook via https://api.telegram.org/bot497498154:<TOKEN>>/setWebhook?url=../im/telegram/{token}

## Create your own Bot

### 1. Create an Telegram app

##### Create the app

https://dev.fitbit.com/apps/new

* OAuth 2.0 Application Type: `Client`
* Callback URL: `http://localhost`
* Default Access Type: `Read & Write`


##### Grant permission on fitbit.com

Take the Client ID from the dashboard of your created app and call `https://www.fitbit.com/oauth2/authorize?response_type=token&expires_in=31536000&client_id=<CLIENT_ID>&redirect_uri=http://localhost&scope=nutrition`


##### Take code from url of failed redirect

```
http://localhost/#access_token=<ACCESS_TOKEN>&user_id=<USER_ID>&scope=nutrition+sleep+settings+profile+location+heartrate+activity+social+weight&token_type=Bearer&expires_in=31536000
```

The request will fail to load a webpage but give you two important bits of information

Your `ACCESS_TOKEN` and your `USER_ID`

### 2. Create a Telegram bot

- Create your own bot by talking to the Botfather as described [here](https://core.telegram.org/bots#6-botfather)
- You will receive a token, do not forget this
- `/setprivacy` -> Disabled
