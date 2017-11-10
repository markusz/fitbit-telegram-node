## 1. Create an Telegram app

https://dev.fitbit.com/apps/new

OAuth 2.0 Application Type: `Client`

Callback URL: `http://localhost`

Default Access Type: `Read & Write`

Register creates the app and gives you three values you will need

##### ClientId

OAuth 2.0 Client ID

`<CLIENT_ID>`

##### Call
 
```
https://www.fitbit.com/oauth2/authorize?response_type=token&expires_in=31536000&client_id=<CLIENT_ID>&redirect_uri=http://localhost&scope=activity%20nutrition%20heartrate%20location%20nutrition%20profile%20settings%20sleep%20social%20weight
```

##### Grant Permission in popup

##### Take code from url of failed redirect

```
http://localhost/#access_token=<ACCESS_TOKEN>&user_id=<USER_ID>&scope=nutrition+sleep+settings+profile+location+heartrate+activity+social+weight&token_type=Bearer&expires_in=31536000
```

The request will fail to load a webpage but give you two important bits of information

Your `ACCESS_TOKEN` and your `USER_ID`

## 2. Create a Telegram bot

- Create a new bot by talking to the goodfather as described [here](https://core.telegram.org/bots#6-botfather)
- You will receive a token, do not forget this
- `/setprivacy` -> Disabled

## 3. Deploy the Backend to AWS Lambda

You need to set up serverless with the AWS CLI, [see here](https://serverless.com/framework/docs/providers/aws/guide/quick-start/)

#### Create an random security token

You can use https://randomkeygen.com/ to generate a random token to secure your communication

#### Set ENV variables

```
export ACCESS_TOKEN=<ACCESS_TOKEN>
export TELEGRAM_API_TOKEN=<TELEGRAM_TOKEN>
export CHAT_ID=<CHAT_ID>
export SECURITY_TOKEN=<SECURITY_TOKEN>
```

#### Deploy

`serverless deploy` will result in something like

```
Service Information

service: fitbit-telegram-api
stage: test
region: eu-west-1
api keys:
  None
endpoints:
  POST - https://<random_string>.execute-api.eu-west-1.amazonaws.com/test/im/telegram/{token}
functions:
  receiveTelegramMessage: fitbit-telegram-api-test-receiveTelegramMessage
  reminderBudgetBeforeMeal: fitbit-telegram-api-test-reminderBudgetBeforeMeal
 
```

## 4. Wire everything together

Open the following URL in your browser

`WEBHOOK_URL` = `https://<random_string>.execute-api.eu-west-1.amazonaws.com/test/im/telegram/<SECURITY_TOKEN>`

`https://api.telegram.org/bot<TELEGRAM_TOKEN>/setWebhook?url=<WEBHOOK_URL>`
