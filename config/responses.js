'use strict';

const { upperFirst } = require('lodash');
const { FitBitFoodIds, FitBitUnitIds } = require('./constants');

const Actions = {
  LOG_CALORIES: 0,
  LOG_FOOD: 1,
  BUDGET: 2
};

const Responses = [
  {
    meta: [/^(\d+) (\w+)$/i, Actions.LOG_CALORIES, 'Calories with Name'],
    getLogSpecifics: matchResult => [Number.parseInt(matchResult[1], 10), upperFirst(matchResult[2])]
  },
  {
    meta: [/^(\d+)$/i, Actions.LOG_CALORIES, 'Calories'],
    getLogSpecifics: matchResult => [Number.parseInt(matchResult[1], 10)]
  },
  {
    meta: [/^salamischeibe (\d+)$/i, Actions.LOG_FOOD, 'Salamischeibe'],
    getLogSpecifics: matchResult => [Number.parseInt(matchResult[1], 10) * 4, FitBitFoodIds.Wurst.SALAMI]
  },
  {
    meta: [/^käsescheibe (\d+)$/i, Actions.LOG_FOOD, 'Käsescheibe'],
    getLogSpecifics: matchResult => [Number.parseInt(matchResult[1], 10) * 25, FitBitFoodIds.Kaese.KAESE]
  },
  {
    meta: [/^buttertoast$/i, Actions.LOG_FOOD, 'Buttertoast'],
    getLogSpecifics: () => (
      [
        [1, FitBitFoodIds.Backwaren.TOAST, FitBitUnitIds.UNIT],
        [15, FitBitFoodIds.BUTTER, FitBitUnitIds.GRAMM]
      ]
    )
  },
  {
    meta: [/^müsli$/i, Actions.LOG_FOOD, 'Müsli'],
    getLogSpecifics: () => (
      [
        [50, FitBitFoodIds.Muesli.KLASSIK, FitBitUnitIds.GRAMM],
        [300, FitBitFoodIds.Drinks.MILCH, FitBitUnitIds.ML]
      ]
    )
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
    meta: [/^müsli (\d+) (\d+)$/i, Actions.LOG_FOOD, 'Müsli with weights'],
    getLogSpecifics: matchResult => (
      [
        [Number.parseInt(matchResult[1], 10), FitBitFoodIds.Muesli.KLASSIK, FitBitUnitIds.GRAMM],
        [Number.parseInt(matchResult[2], 10), FitBitFoodIds.Drinks.MILCH, FitBitUnitIds.ML]
      ]
    )
  },
  {
    meta: [/^subway$/i, Actions.LOG_FOOD, 'Subway standard 6ft'],
    getLogSpecifics: () => (
      [
        [2, FitBitFoodIds.Restaurants.Subway.CHICKEN_FAJITA, FitBitUnitIds.UNIT],
        [2, FitBitFoodIds.Restaurants.Subway.CHEDDAR_CHEESE, FitBitUnitIds.UNIT],
        [2, FitBitFoodIds.Restaurants.Subway.CHIPOTLE_SAUCE, FitBitUnitIds.UNIT]
      ]
    )
  },
  {
    meta: [/^subway halb$/i, Actions.LOG_FOOD, 'Subway standard 3ft'],
    getLogSpecifics: () => (
      [
        [1, FitBitFoodIds.Restaurants.Subway.CHICKEN_FAJITA, FitBitUnitIds.UNIT],
        [1, FitBitFoodIds.Restaurants.Subway.CHEDDAR_CHEESE, FitBitUnitIds.UNIT],
        [1, FitBitFoodIds.Restaurants.Subway.CHIPOTLE_SAUCE, FitBitUnitIds.UNIT]
      ]
    )
  },
  {
    meta: [/^apfel$/i, Actions.LOG_FOOD, 'Apfel'],
    getLogSpecifics: () => [1, FitBitFoodIds.Fruit.APFEL, FitBitUnitIds.MEDIUM_SIZE]
  },
  {
    meta: [/^birne$/i, Actions.LOG_FOOD, 'Birne'],
    getLogSpecifics: () => [1, FitBitFoodIds.Fruit.BIRNE, FitBitUnitIds.BIRNE_GANZ]
  },
  {
    meta: [/^mandarine$/i, Actions.LOG_FOOD, 'Mandarine'],
    getLogSpecifics: () => [1, FitBitFoodIds.Fruit.MANDARINE, FitBitUnitIds.STUECK_1]
  },
  {
    meta: [/^breze$/i, Actions.LOG_FOOD, 'Breze'],
    getLogSpecifics: () => [1, FitBitFoodIds.Backwaren.BREZE, FitBitUnitIds.UNIT]
  },
  {
    meta: [/^semmel$/i, Actions.LOG_FOOD, 'Semmel'],
    getLogSpecifics: () => [1, FitBitFoodIds.Backwaren.SEMMEL, FitBitUnitIds.GROSS_1]
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
    meta: [/^leichtes weissbier$/i, Actions.LOG_FOOD, 'Leichtes Weißbier'],
    getLogSpecifics: () => [500, FitBitFoodIds.Drinks.LEICHTES_WEISSBIER, FitBitUnitIds.ML]
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
