'use strict';

const { FitBitFoodIds, FitBitUnitIds } = require('./constants');

const Actions = {
  LOG_CALORIES: 0,
  LOG_FOOD: 1,
  BUDGET: 2
};

const Responses = [
  {
    meta: [/^(\d+)$/i, Actions.LOG_CALORIES, 'Calories'],
    getLogSpecifics: matchResult => [Number.parseInt(matchResult[1], 10)]
  },
  {
    meta: [/^joghurt$/i, Actions.LOG_FOOD, 'Joghurt'],
    getLogSpecifics: () => (
      [
        [300, FitBitFoodIds.Joghurt.Plain.DEFAULT],
        [100, FitBitFoodIds.Joghurt.Fruit.DEFAULT],
        [40, FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
  },
  {
    meta: [/^joghurt (\d+) (\d+) (\d+)$/i, Actions.LOG_FOOD, 'Joghurt with weights'],
    getLogSpecifics: matchResult => (
      [
        [Number.parseInt(matchResult[1], 10), FitBitFoodIds.Joghurt.Plain.DEFAULT],
        [Number.parseInt(matchResult[2], 10), FitBitFoodIds.Joghurt.Fruit.DEFAULT],
        [Number.parseInt(matchResult[3], 10), FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
  },
  {
    meta: [/^apfel$/i, Actions.LOG_FOOD, 'Joghurt'],
    getLogSpecifics: () => [100, FitBitFoodIds.Joghurt.Plain.DEFAULT, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^kaffee$/i, Actions.LOG_FOOD, 'Kaffee'],
    getLogSpecifics: () => [1, FitBitFoodIds.Drinks.COFFEE, FitBitUnitIds.TASSE_180_ML]
  },
  {
    meta: [/^weissbier$/i, Actions.LOG_FOOD, 'Weißbier'],
    getLogSpecifics: () => [1, FitBitFoodIds.Drinks.WEISSBIER, FitBitUnitIds.FLASCHE_500_ML]
  },
  {
    meta: [/^helles$/i, Actions.LOG_FOOD, 'Helles'],
    getLogSpecifics: () => [1, FitBitFoodIds.Drinks.HELLES, FitBitUnitIds.UNIT]
  },
  {
    meta: [/^cappuccino$/i, Actions.LOG_FOOD, 'Cappuccino'],
    getLogSpecifics: () => [1, FitBitFoodIds.Drinks.CAPPUCCINO, FitBitUnitIds.TASSE_240_ML]
  }
];

module.exports = {
  Responses,
  Actions
};
