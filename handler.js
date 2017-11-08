'use strict';

const superagent = require('superagent');
const moment = require('moment');
const lodash = require('lodash');

const TelegramMessage = require('./src/telegram-message').TelegramMessage;
const TelegramApiClient = require('./src/telegram-api-client').TelegramApiClient;
const Responses = require('./config/responses').Responses;
const Actions = require('./config/responses').Actions;

class FitBitApiClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
  }

  generateAuthHeader() {
    return {
      Authorization: `Bearer ${this.accessToken}`
    };
  }

  getUser() {
    return superagent
      .get('https://api.fitbit.com/1/user/-/profile.json')
      .set(this.generateAuthHeader());
  }

  getFoodLog(dateString) {
    const date = dateString || moment().format('YYYY-MM-DD');
    return superagent
      .get(`https://api.fitbit.com/1/user/-/foods/log/date/${date}.json`)
      .set(this.generateAuthHeader());
  }

  logCaloriesForDay(dateString) {
    const date = dateString || moment().format('YYYY-MM-DD');
    // foodName=Kantine&date=2014-01-01&mealTypeId=5&brandName=P7S1&calories=200&amount=1.00&unitId=222

    return superagent
      .post('https://api.fitbit.com/1/user/-/foods/log.json')
      .query({
        brandName: 'P7S1',
        foodName: 'Kantine',
        date: date,
        mealTypeId: 5,
        calories: 200,
        amount: 1.00,
        unitId: 222,
      })
      .set(this.generateAuthHeader());
  }
}


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

module.exports.TelegramMessageHandler = (event, context, callback) => {
  const message = lodash.get(JSON.parse(event.body), 'message');
  console.log(message);
  const telegramMessage = TelegramMessage.getInstance(message);
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN, telegramMessage.getChatId());
  const fitBitApiClient = new FitBitApiClient(process.env.ACCESS_TOKEN);

  const response = TelegramApiClient.getResponseForMessage(telegramMessage.getLowerCaseTextMessage());

  console.log(telegramMessage.getLowerCaseTextMessage());
  console.log(response);

  fitBitApiClient.logCaloriesForDay('2014-01-01')
    .then((res) => {
      console.log(res.body);
      const reply = !response ? 'Wat willste?' : `${response.title} -> ${res.body.foodDay.summary.calories}`;
      telegramApiClient.replyInTelegramChat(reply).then(() => {
        callback(null, {
          statusCode: 200,
          body: 'Message nicht erkannt. Keine Antwort',
        });
      }).catch(callback);
    }).catch(callback);
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
