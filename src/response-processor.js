'use strict'

const moment = require('moment-timezone')
const { FitBitMealTypeIds, FitBitUnitIds } = require('../config/constants')
const { Responses, Actions } = require('../config/responses')

const MESSAGE_MAX_LINE_LENGTH = 37

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
    console.log(`time=${time.format('YYYY-MM-DD HH:mm:ss')}`)
    const timePattern = 'HH:mm:ss'
    if (time.isBetween(moment('06:00:00', timePattern), moment('09:30:00', timePattern), null, '[]')) {
      return FitBitMealTypeIds.BREAKFAST
    }

    if (time.isBetween(moment('09:30:00', timePattern), moment('11:00:00', timePattern), null, '(]')) {
      return FitBitMealTypeIds.MORNING_SNACK
    }

    if (time.isBetween(moment('11:00:00', timePattern), moment('13:30:00', timePattern), null, '(]')) {
      return FitBitMealTypeIds.LUNCH
    }

    if (time.isBetween(moment('13:30:00', timePattern), moment('17:00:00', timePattern), null, '(]')) {
      return FitBitMealTypeIds.AFTERNOON
    }

    if (time.isBetween(moment('17:00:00', timePattern), moment('20:30:00', timePattern), null, '(]')) {
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
    return msg.padEnd(maxLength).slice(0, maxLength)
  }

  static convertFoodLogJSONToUserFriendlyText (json) {
    const horizontalSeparator = ' | '

    const secondColumnLength = 4
    const thirdColumnLength = 5
    const percentDecimals = 1
    const separatorSpaceLength = horizontalSeparator.length * 2

    const firstColumnLength = MESSAGE_MAX_LINE_LENGTH - (secondColumnLength + thirdColumnLength + percentDecimals + separatorSpaceLength)
    const separator = `${''.padEnd(firstColumnLength, '-')}${horizontalSeparator}${''.padEnd(secondColumnLength, '-')}${horizontalSeparator}${''.padEnd(thirdColumnLength, '-')}`

    const stringElements = [
      '```',
      separator,
      `${ResponseProcessor.fitMsg('Food', firstColumnLength)}${horizontalSeparator}kcal${horizontalSeparator}  %`
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
      const calories = foodEntry.nutritionalValues.calories.toString().padStart(secondColumnLength)
      const percentageOfDailyBudget = (foodEntry.nutritionalValues.calories / goal * 100).toFixed(percentDecimals).toString().padStart(thirdColumnLength)
      const message = `${mobileFriendlyName}${horizontalSeparator}${calories}${horizontalSeparator}${percentageOfDailyBudget}`
      stringElements.push(message)
    }

    stringElements.push(separator)
    stringElements.push(`${ResponseProcessor.fitMsg('Consumed', firstColumnLength)}${horizontalSeparator}${status.toString().padStart(secondColumnLength)}${horizontalSeparator}${(status / goal * 100).toFixed(percentDecimals).padStart(thirdColumnLength)}`)
    stringElements.push(`${ResponseProcessor.fitMsg('Remaining', firstColumnLength)}${horizontalSeparator}${(goal - status).toString().padStart(secondColumnLength)}${horizontalSeparator}${((goal - status) / goal * 100).toFixed(percentDecimals).padStart(thirdColumnLength)}`)
    stringElements.push(separator)
    stringElements.push('```')

    const logString = stringElements.join('\n')
    console.log(logString)
    return logString
  }

  static getPossibleCommands () {
    const messageParts = Responses.map(res => `${''.padEnd(MESSAGE_MAX_LINE_LENGTH, '-')}\n${ResponseProcessor.fitMsg(res.meta[2].toString(), MESSAGE_MAX_LINE_LENGTH)}\n${res.meta[0].toString()}`)
    return '```\n' + messageParts.join('\n') + '\n```'
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
