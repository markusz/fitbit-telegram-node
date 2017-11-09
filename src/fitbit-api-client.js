'use strict';

const superagent = require('superagent');
const moment = require('moment');
const Q = require('q');

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

  getFoodLog(dateString = moment('2014-01-02', 'YYYY-MM-DD').format('YYYY-MM-DD')) {
    return superagent
      .get(`https://api.fitbit.com/1/user/-/foods/log/date/${dateString}.json`)
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

  logFoodItem(json) {
    return superagent
      .post('https://api.fitbit.com/1/user/-/foods/log.json')
      .query(json)
      .set(this.generateAuthHeader());
  }

  logFood(json) {
    if (Array.isArray(json)) {
      const logPromises = json.map(foodItem => this.logFoodItem(foodItem));
      return Q.all(logPromises);
    }

    return this.logFoodItem(json);
  }
}

module.exports = {
  FitBitApiClient
};
