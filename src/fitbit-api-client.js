'use strict'

const superagent = require('superagent')
const moment = require('moment-timezone')
const Q = require('q')

class FitBitApiClient {
  constructor (accessToken) {
    this.accessToken = accessToken
  }

  generateAuthHeader () {
    return {
      Authorization: `Bearer ${this.accessToken}`
    }
  }

  getUser () {
    return superagent
      .get('https://api.fitbit.com/1/user/-/profile.json')
      .set(this.generateAuthHeader())
  }

  getFoodLog (dateString = moment().tz('Europe/Berlin').format('YYYY-MM-DD')) {
    return superagent
      .get(`https://api.fitbit.com/1/user/-/foods/log/date/${dateString}.json`)
      .set(this.generateAuthHeader())
  }

  logFoodItem (json) {
    return superagent
      .post('https://api.fitbit.com/1/user/-/foods/log.json')
      .query(json)
      .set(this.generateAuthHeader())
  }

  logFood (json) {
    if (Array.isArray(json)) {
      const logPromises = json.map(foodItem => this.logFoodItem(foodItem))
      return Q.all(logPromises)
    }

    return this.logFoodItem(json)
  }
}

module.exports = {
  FitBitApiClient
}
