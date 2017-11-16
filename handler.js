'use strict';

/* eslint-disable eqeqeq */
// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
const AWS = require('aws-sdk');
const lodash = require('lodash');

const { TelegramMessage } = require('./src/telegram-message');
const { TelegramApiClient } = require('./src/telegram-api-client');
const { FitBitApiClient } = require('./src/fitbit-api-client');

const dynamoDB = new AWS.DynamoDB({ apiVersion: '2012-08-10' });

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
};

const messageReceivedCallback = cb => (message) => {
  console.log(message);
  cb(null, { statusCode: 200 });
};

const handleAccessTokenResponse = (event) => {
  const accessToken = lodash.get(event, 'queryStringParameters.access_token');
  const userId = lodash.get(event, 'queryStringParameters.user_id');
  const chatId = lodash.get(event, 'queryStringParameters.state');

  return dynamoDB.putItem({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      chatId: { N: chatId },
      userId: { S: userId },
      accessToken: { S: accessToken }
    }
  }).promise();
};

const getAccessTokenForChatId = (chatId) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      chatId: { N: `${chatId}` },
    }
  };

  return dynamoDB.getItem(params).promise();
};

const makeOAuthURLForInitMessage = (telegramMessage) => {
  const redirectURI = 'https://s3.eu-west-1.amazonaws.com/fitbit-telegram-bridge/index.html';
  const scope = 'nutrition';

  return `https://www.fitbit.com/oauth2/authorize?response_type=token&expires_in=31536000&client_id=${process.env.CLIENT_ID}&redirect_uri=${redirectURI}&scope=${scope}&state=${telegramMessage.getChatId()}`;
};

module.exports.FitbitOAuthResponseHandler = (event, context, callback) => {
  const eventAsString = JSON.stringify(event);
  console.log(eventAsString);

  const request = handleAccessTokenResponse(event);
  request.then(() => {
    callback(null, {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({ status: 'Success' })
    });
  });

  request.catch((err) => {
    callback(null, {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ status: 'Error', error: err })
    });
  });
};

module.exports.TelegramMealReminder = (event, context, callback) => {
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN, process.env.TELEGRAM_CHAT_ID);

  getAccessTokenForChatId(process.env.TELEGRAM_CHAT_ID).then((dynamoDBItem) => {
    const accessToken = lodash.get(dynamoDBItem, 'Item.accessToken.S');
    const fitBitApiClient = new FitBitApiClient(accessToken);

    fitBitApiClient
      .getFoodLog()
      .then((getLogRes) => {
        const total = lodash.get(getLogRes, 'body.summary.calories', null);
        const budget = lodash.get(getLogRes, 'body.goals.calories', '∞');

        const reply = `Remaining budget: ${budget - total} / ${budget}.`;

        telegramApiClient
          .replyInTelegramChat(reply)
          .then(console.log)
          .catch(console.error);
      }).catch(console.error);
  });
};

module.exports.TelegramMessageHandler = (event, context, callback) => {
  const message = lodash.get(JSON.parse(event.body), 'message');
  const telegramMessage = TelegramMessage.getInstance(message);
  const token = lodash.get(event, 'pathParameters.token');
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN, telegramMessage.getChatId());
  const masterCallback = messageReceivedCallback(callback);

  console.log(`chatId=${telegramMessage.getChatId()}`);

  getAccessTokenForChatId(telegramMessage.getChatId()).then((dynamoDBItem) => {
    const accessToken = lodash.get(dynamoDBItem, 'Item.accessToken.S');
    console.log(`accessToken=${accessToken}`);

    const fitBitApiClient = new FitBitApiClient(accessToken);
    // Telegram expects a HTTP200 response to acknowlege receiving the message -> One cb fits all
    if (telegramMessage.getLowerCaseTextMessage() === 'init') {
      const url = makeOAuthURLForInitMessage(telegramMessage);
      return telegramApiClient.replyInTelegramChat(url)
        .then(masterCallback)
        .catch(masterCallback);
    }

    // SECURITY_TOKEN ensures that only calls from the Telegram Webhook are allowed
    if (process.env.SECURITY_TOKEN != token) {
      console.error(`Request declined. token=${token}`);
      return callback(null, { statusCode: 200 });
    }

    const queryParams = TelegramApiClient.getQueryParamsForFoodLog(telegramMessage.getLowerCaseTextMessage());

    console.log(telegramMessage.getLowerCaseTextMessage());
    console.log(queryParams);


    if (!queryParams) {
      return telegramApiClient.replyInTelegramChat('Command not understood. Nothing has been logged')
        .then(masterCallback)
        .catch(masterCallback);
    }

    fitBitApiClient
      .logFood(queryParams)
      .then((/* logRes */) => {
        fitBitApiClient
          .getFoodLog().then((getLogRes) => {
            const total = lodash.get(getLogRes, 'body.summary.calories', null);
            const budget = lodash.get(getLogRes, 'body.goals.calories', '∞');
            const reply = `Food logged. Calories today: ${total}, Remaining budget: ${budget - total} / ${budget}.`;

            telegramApiClient.replyInTelegramChat(reply)
              .then(masterCallback)
              .catch(masterCallback);
          }).catch(masterCallback);
      }).catch(masterCallback);
  }).catch(masterCallback);
};
