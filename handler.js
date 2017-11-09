'use strict';

const lodash = require('lodash');

const { TelegramMessage } = require('./src/telegram-message');
const { TelegramApiClient } = require('./src/telegram-api-client');
const { FitBitApiClient } = require('./src/fitbit-api-client');
const { Responses, Actions } = require('./config/responses');

module.exports.UserProfileHandler = (event, context, callback) => {
  const fitBitApiClient = new FitBitApiClient(process.env.ACCESS_TOKEN);

  fitBitApiClient.getUser().then((res) => {
    const r = {
      statusCode: 200,
      body: JSON.stringify(res.body),
    };

    callback(null, r);
  }).catch((err) => {
    callback({
      statusCode: 500,
      body: JSON.stringify(err),
    });
  });
};

const messageReceivedCallback = cb => (message) => {
  console.log(message);
  cb(null, { statusCode: 200 });
};

module.exports.TelegramMessageHandler = (event, context, callback) => {
  const message = lodash.get(JSON.parse(event.body), 'message');
  const telegramMessage = TelegramMessage.getInstance(message);
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN, telegramMessage.getChatId());
  const fitBitApiClient = new FitBitApiClient(process.env.ACCESS_TOKEN);

  const queryParams = TelegramApiClient.getQueryParamsForFoodLog(telegramMessage.getLowerCaseTextMessage());

  console.log(telegramMessage.getLowerCaseTextMessage());
  console.log(queryParams);

  // Telegram expects a HTTP200 response to acknowlege receiving the message -> One cb fits all
  const masterCallback = messageReceivedCallback(callback);

  if (!queryParams) {
    return telegramApiClient.replyInTelegramChat('Not known')
      .then(masterCallback)
      .catch(masterCallback);
  }

  fitBitApiClient
    .logFood(queryParams)
    .then((/* logRes */) => {
      fitBitApiClient
        .getFoodLog()
        .then((getLogRes) => {
          const total = lodash.get(getLogRes, 'body.summary.calories', null);
          const budget = lodash.get(getLogRes, 'body.goals.calories', '∞');

          const reply = `Food logged. Today calories: ${total}, Remaining budget: ${budget}`;

          telegramApiClient
            .replyInTelegramChat(reply)
            .then(masterCallback)
            .catch(masterCallback);
        }).catch(masterCallback);
    }).catch(masterCallback);
};

module.exports.AddToFoodlogHandler = (event, context, callback) => {
  console.log(event);
  console.log(context);

  const message = lodash.get(JSON.parse(event.body), 'message');
  console.log(message);
  console.log(process.env.ACCESS_TOKEN);
  console.log(process.env.TELEGRAM_API_TOKEN);
  const telegramMessage = TelegramMessage.getInstance(message);
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN, telegramMessage.getChatId());
  const fitBitApiClient = new FitBitApiClient(process.env.ACCESS_TOKEN);

  // cons

  fitBitApiClient.getFoodLog().then((fitbitResult) => {
    telegramApiClient.replyInTelegramChat(fitbitResult.body.summary.calories)
      .then(console.log)
      .catch(console.error);

    callback(null, {
      statusCode: 200,
      body: JSON.stringify(fitbitResult.body),
    });
  }).catch((err) => {
    callback({
      statusCode: 500,
      body: JSON.stringify(err),
    });
  });
};

module.exports.FoodLogHandler = (event, context, callback) => {
  const fitBitApiClient = new FitBitApiClient(process.env.ACCESS_TOKEN);
  console.log(event);
  console.log(context);
  const date = lodash.get(event, 'pathParameters.date');

  fitBitApiClient.getFoodLog(date).then((res) => {
    const r = {
      statusCode: 200,
      body: JSON.stringify(res.body),
    };

    callback(null, r);
  }).catch((err) => {
    callback({
      statusCode: 500,
      body: JSON.stringify(err),
    });
  });
};
