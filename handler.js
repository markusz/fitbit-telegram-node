'use strict';

const lodash = require('lodash');

const { TelegramMessage } = require('./src/telegram-message');
const { TelegramApiClient } = require('./src/telegram-api-client');
const { FitBitApiClient } = require('./src/fitbit-api-client');

const messageReceivedCallback = cb => (message) => {
  console.log(message);
  cb(null, { statusCode: 200 });
};

module.exports.TelegramMealReminder = (event, context, callback) => {
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN, process.env.CHAT_ID);
  const fitBitApiClient = new FitBitApiClient(process.env.ACCESS_TOKEN);

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
};

module.exports.TelegramMessageHandler = (event, context, callback) => {
  const message = lodash.get(JSON.parse(event.body), 'message');
  const telegramMessage = TelegramMessage.getInstance(message);
  const token = lodash.get(event, 'pathParameters.token');

  /**
   * SECURITY_TOKEN ensures that only calls from the Telegram Webhook are allowed
   * CHAT_ID ensures that only you can use the bot to log food
   */
  if (process.env.SECURITY_TOKEN != token || process.env.CHAT_ID != telegramMessage.getChatId()) {
    console.error(`Request declined. token=${token}, chatId=${telegramMessage.getChatId()}`);
    return callback(null, { statusCode: 200 });
  }

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

          const reply = `Food logged. Calories today: ${total}, Remaining budget: ${budget - total} / ${budget}.`;

          telegramApiClient
            .replyInTelegramChat(reply)
            .then(masterCallback)
            .catch(masterCallback);
        }).catch(masterCallback);
    }).catch(masterCallback);
};
