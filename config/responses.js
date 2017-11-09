'use strict';

const moment = require('moment');
const { FitBitMealTypeIds, FitBitFoodIds, FitBitUnitIds } = require('./constants');

const Actions = {
  LOG: 1,
  BUDGET: 2
};

const Responses = [
  {
    meta: [/^joghurt$/i, Actions.LOG, 'Joghurt'],
    getLogSpecifics: () => [100, FitBitFoodIds.Joghurt.Plain.DEFAULT, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^apfel$/i, Actions.LOG, 'Joghurt'],
    getLogSpecifics: () => [100, FitBitFoodIds.Joghurt.Plain.DEFAULT, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^kaffee$/i, Actions.LOG, 'Kaffee'],
    getLogSpecifics: () => [1, FitBitFoodIds.Drinks.COFFEE, FitBitUnitIds.UNIT]
  },
  {
    meta: [/^bier/i, Actions.LOG, 'Bier'],
    getLogSpecifics: () => [100, FitBitFoodIds.Drinks.WEISSBIER, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^cappuccino/i, Actions.LOG, 'Cappuccino'],
    getLogSpecifics: () => [1, FitBitFoodIds.Drinks.CAPPUCCINO, FitBitUnitIds.TASSE_240_ML]
  },
  {
    meta: [/^joghurt (\d+) (\d+) (\d+)$/i, Actions.LOG, 'Joghurt with weights'],
    getLogSpecifics: matchResult => (
      [
        [Number.parseInt(matchResult[1], 10), FitBitFoodIds.Joghurt.Plain.DEFAULT],
        [Number.parseInt(matchResult[2], 10), FitBitFoodIds.Joghurt.Fruit.DEFAULT],
        [Number.parseInt(matchResult[3], 10), FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
  }
];

class ResponseProcessor {
  constructor(message) {
    this.config = Responses.find(res => res.meta[0].test(message));
    this.message = {
      text: message,
      timestamp: moment()
    };
  }

  static fromMessage(message) {
    return new ResponseProcessor(message);
  }

  static getMealTypeByTime(time = moment()) {
    const timePattern = 'hh:mm:ss';
    if (time.isBetween(moment('07:00:00', timePattern), moment('09:30:00', timePattern))) {
      return FitBitMealTypeIds.BREAKFAST;
    }

    if (time.isBetween(moment('09:30:00', timePattern), moment('11:30:00', timePattern))) {
      return FitBitMealTypeIds.MORNING_SNACK;
    }

    if (time.isBetween(moment('11:30:00', timePattern), moment('13:30:00', timePattern))) {
      return FitBitMealTypeIds.LUNCH;
    }

    if (time.isBetween(moment('13:30:00', timePattern), moment('18:00:00', timePattern))) {
      return FitBitMealTypeIds.AFTERNOON;
    }

    if (time.isBetween(moment('18:00:00', timePattern), moment('20:30:00', timePattern))) {
      return FitBitMealTypeIds.DINNER;
    }

    if (time.isBetween(moment('20:30:00', timePattern), moment('23:00:00', timePattern))) {
      return FitBitMealTypeIds.EVENING_SNACK;
    }

    return FitBitMealTypeIds.ANYTIME;
  }

  toJSON() {
    if (!this.isMatched()) {
      return null;
    }

    const matchResult = this.message.text.match(this.config.meta[0]);
    const logSpecifics = this.config.getLogSpecifics(matchResult);

    if (Array.isArray(logSpecifics[0])) {
      return logSpecifics.map(ls => ResponseProcessor.getLogRequestParams.apply(this, ls));
    }

    return ResponseProcessor.getLogRequestParams.apply(this, logSpecifics);
  }

  static getLogRequestParams(amount, foodId, unitId = FitBitUnitIds.GRAMM, date = moment('2014-01-02', 'YYYY-MM-DD').format('YYYY-MM-DD'), mealTypeId = ResponseProcessor.getMealTypeByTime()) {
    return {
      amount,
      foodId,
      date,
      mealTypeId,
      unitId
    };
  }

  isMatched() {
    return this.config !== undefined;
  }
}

module.exports = {
  Responses,
  Actions,
  ResponseProcessor
};
