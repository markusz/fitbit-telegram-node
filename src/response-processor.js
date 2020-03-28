'use strict'

const moment = require('moment-timezone')
const { FitBitMealTypeIds, FitBitUnitIds } = require('../config/constants')
const { Responses, Actions } = require('../config/responses')

class ResponseProcessor {
  constructor (message) {
    this.config = Responses.find(res => res.meta[0].test(message))
    this.message = {
      text: message,
      timestamp: moment()
    }
  }

  static fromMessage (message) {
    return new ResponseProcessor(message)
  }

  static getMealTypeByTime (time = moment().tz('Europe/Berlin')) {
    const timePattern = 'HH:mm:ss'
    if (time.isBetween(moment('06:00:00', timePattern), moment('09:30:00', timePattern), null, '[]')) {
      return FitBitMealTypeIds.BREAKFAST
    }

    if (time.isBetween(moment('09:30:00', timePattern), moment('11:30:00', timePattern), null, '(]')) {
      return FitBitMealTypeIds.MORNING_SNACK
    }

    if (time.isBetween(moment('11:30:00', timePattern), moment('13:30:00', timePattern), null, '(]')) {
      return FitBitMealTypeIds.LUNCH
    }

    if (time.isBetween(moment('13:30:00', timePattern), moment('18:00:00', timePattern), null, '(]')) {
      return FitBitMealTypeIds.AFTERNOON
    }

    if (time.isBetween(moment('18:00:00', timePattern), moment('20:30:00', timePattern), null, '(]')) {
      return FitBitMealTypeIds.DINNER
    }

    if (time.isBetween(moment('20:30:00', timePattern), moment('23:00:00', timePattern), null, '(]')) {
      return FitBitMealTypeIds.EVENING_SNACK
    }

    return FitBitMealTypeIds.ANYTIME
  }

  toJSON () {
    if (!this.isMatched()) {
      return null
    }

    const matchResult = this.message.text.match(this.config.meta[0])
    const logSpecifics = this.config.getLogSpecifics(matchResult)

    if (this.config.meta[1] === Actions.LOG_FOOD) {
      if (Array.isArray(logSpecifics[0])) {
        return logSpecifics.map(ls => ResponseProcessor.getLogRequestParamsForFood.apply(this, ls))
      }

      return ResponseProcessor.getLogRequestParamsForFood.apply(this, logSpecifics)
    }

    if (this.config.meta[1] === Actions.LOG_CALORIES) {
      return ResponseProcessor.getLogRequestParamsForCalories.apply(this, logSpecifics)
    }

    return null
  }

  static getLogRequestParamsForFood (amount, foodId, unitId = FitBitUnitIds.GRAMM, date = moment().tz('Europe/Berlin').format('YYYY-MM-DD'), mealTypeId = ResponseProcessor.getMealTypeByTime()) {
    return {
      amount,
      foodId,
      date,
      mealTypeId,
      unitId
    }
  }

  static fitMsg (msg, maxLength) {
    console.log(msg, maxLength)
    const s = msg.padEnd(maxLength).slice(0, maxLength)
    console.log(s)
    return s
  }

  static convertFoodLogJSONToUserFriendlyText (json) {
    const firstColumnLength = 23
    const separator = `${''.padEnd(firstColumnLength, '-')} | ---- | ---- `

    const stringElements = [
      "```",
      separator,
      `${ResponseProcessor.fitMsg('Food', firstColumnLength)} | kcal |  %`
    ]

    const goal = json.goals.calories
    const status = json.summary.calories

    let mealTypeId = -1
    for (let i = 0; i < json.foods.length; i++) {
      const foodEntry = json.foods[i]
      if (foodEntry.loggedFood.mealTypeId > mealTypeId) {
        mealTypeId = foodEntry.loggedFood.mealTypeId
        stringElements.push(separator)
      }

      const mobileFriendlyName = ResponseProcessor.fitMsg(foodEntry.loggedFood.name, firstColumnLength)
      const calories = foodEntry.nutritionalValues.calories.toString().padStart(4)
      const percentageOfDailyBudget = (foodEntry.nutritionalValues.calories / goal * 100).toFixed(1).toString().padStart(4)
      const message = `${mobileFriendlyName} | ${calories} | ${percentageOfDailyBudget}`
      stringElements.push(message)
    }

    stringElements.push(separator)
    stringElements.push(`${ResponseProcessor.fitMsg('Consumed', firstColumnLength)} | ${status.toString().padStart(4)} | ${(status / goal * 100).toFixed(1).padStart(4)}`)
    stringElements.push(`${ResponseProcessor.fitMsg('Remaining', firstColumnLength)} | ${(goal - status).toString().padStart(4)} | ${((goal - status) / goal * 100).toFixed(1).padStart(4)}`)
    stringElements.push(separator)
    stringElements.push("```")

    const logString = stringElements.join('\n')
    console.log(logString)
    return logString
  }

  static getPossibleCommands () {
    const messageParts = Responses.map(res => `${res.meta[0].toString()} => ${res.meta[2].toString()}`)
    return messageParts.join('\n')
  }

  static getLogRequestParamsForCalories (calories, foodName = moment()
    .tz('Europe/Berlin')
    .format('HH:mm'), amount = 1.00, unitId = FitBitUnitIds.UNIT, date = moment().tz('Europe/Berlin').format('YYYY-MM-DD'), mealTypeId = ResponseProcessor.getMealTypeByTime()) {
    return {
      foodName,
      unitId,
      calories,
      amount,
      date,
      mealTypeId
    }
  }

  isMatched () {
    return this.config !== undefined
  }
}

module.exports = {
  ResponseProcessor
}
