import superagent from 'superagent';

import moment from 'moment-timezone';

export default class FitBitApiClient {
  accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  generateAuthHeader() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  getUser() {
    return superagent
      .get('https://api.fitbit.com/1/user/-/profile.json')
      .set(this.generateAuthHeader());
  }

  getGoals() {
    return superagent
      .get('https://api.fitbit.com/1/user/-/foods/log/goal.json')
      .set(this.generateAuthHeader());
  }

  getFoodLog(dateString = moment().tz('Europe/Berlin').format('YYYY-MM-DD')) {
    return superagent
      .get(`https://api.fitbit.com/1/user/-/foods/log/date/${dateString}.json`)
      .set(this.generateAuthHeader());
  }

  logFoodItem(json: any) {
    return superagent
      .post('https://api.fitbit.com/1/user/-/foods/log.json')
      .query(json)
      .set(this.generateAuthHeader());
  }

  logFood(json: any) {
    if (Array.isArray(json)) {
      const logPromises = json.map((foodItem) => this.logFoodItem(foodItem));
      return Promise.allSettled(logPromises);
    }

    return this.logFoodItem(json);
  }
}
