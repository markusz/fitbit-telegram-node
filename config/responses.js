'use strict'

const { startCase } = require('lodash')
const { FitBitFoodIds, FitBitUnitIds } = require('./constants')

const Actions = {
  LOG_CALORIES: 0,
  LOG_FOOD: 1,
  BUDGET: 2
}

function numberAsStringToInt (numberAsString, multiplyWith = 1) {
  return Math.round(Number.parseInt(numberAsString, 10) * multiplyWith)
}

const Responses = [
  {
    meta: [/^(\d+) ([\u00C0-\u017Fa-zA-Z ]+)$/i, Actions.LOG_CALORIES, 'Calories with Name'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1]), startCase(matchResult[2])]
  },
  {
    meta: [/^(\d+) (\d+) ([\u00C0-\u017Fa-zA-Z ]+)$/i, Actions.LOG_CALORIES, '$1 gramm of a food with $2 calories/100g'],
    getLogSpecifics: matchResult => [
      Math.round(numberAsStringToInt(matchResult[1]) / 100 * numberAsStringToInt(matchResult[2])),
      `${matchResult[1]}g ${startCase(matchResult[3])} á ${matchResult[2]}kcal/100g`
    ]
  },
  {
    meta: [/^(\d+)$/i, Actions.LOG_CALORIES, 'Calories'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1])]
  },
  {
    meta: [/^p (\d+)$/i, Actions.LOG_CALORIES, 'Classic Ceasars Salad from Dean and David'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1]) * 25, `${numberAsStringToInt(matchResult[1])} x Plätzchen`]
  },
  {
    meta: [/^dd c$/i, Actions.LOG_CALORIES, 'Classic Ceasars Salad from Dean and David'],
    getLogSpecifics: matchResult => [367 + 247 + 122, 'Classic Ceasars Salad (Dean & David)']
  },
  {
    meta: [/^käse (\d+)$/i, Actions.LOG_FOOD, 'Eine Scheibe Bergbauernkäse mit etwa 22g'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1], 22), FitBitFoodIds.Kaese.KAESE]
  },
  {
    meta: [/^reis (\d+)$/i, Actions.LOG_FOOD, 'Gekochter Reis'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1]), FitBitFoodIds.REIS, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^risotto (\d+)$/i, Actions.LOG_CALORIES, 'Selbstgemachtes Meeresfrüchterisotto mit 111kcal / 100g'],
    getLogSpecifics: matchResult => [
      Math.round(numberAsStringToInt(matchResult[1]) / 100 * 111),
      `${matchResult[1]}g  Risotto á 111kcal/100g`
    ]
  },
  {
    meta: [/^brokkoligratin (\d+)$/i, Actions.LOG_CALORIES, 'Maggi Brokkoligratin (150g Käse, 2x Maggi, 1kg Brokkoli) mit 93kcal / 100g'],
    getLogSpecifics: matchResult => [
      Math.round(numberAsStringToInt(matchResult[1]) / 100 * 93),
      `${matchResult[1]}g  Brokkoligratin á 93kcal/100g`
    ]
  },
  {
    meta: [/^kartoffeln (\d+)$/i, Actions.LOG_FOOD, 'Kartoffeln gekocht'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1]), FitBitFoodIds.Vegetables.KARTOFFELN_GEKOCHT, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^nudeln (\d+)$/i, Actions.LOG_FOOD, 'Nudeln gekocht'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1]), FitBitFoodIds.NUDELN, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^schinken (\d+)$/i, Actions.LOG_FOOD, 'Eine Scheibe Schinken mit etwa 20g'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1], 20), FitBitFoodIds.Wurst.SCHINKEN]
  },
  {
    meta: [/^salami s (\d+)$/i, Actions.LOG_FOOD, 'Kleine Salamischeibe mit etwa 4g (fein geschnitten, 4-5 cm im Durchmesser)'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1], 4), FitBitFoodIds.Wurst.SALAMI]
  },
  {
    meta: [/^salami m (\d+)$/i, Actions.LOG_FOOD, 'Mittlere Salamischeibe mit etwa 8g (etwas dicker geschnitten / größerer Durchmesser)'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1], 8), FitBitFoodIds.Wurst.SALAMI]
  },
  {
    meta: [/^salami l (\d+)$/i, Actions.LOG_FOOD, 'Große Salamischeibe mit etwa 12g (dick geschnitten, >8cm Durchmesser'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1], 12), FitBitFoodIds.Wurst.SALAMI]
  },
  {
    meta: [/^traube (\d+)$/i, Actions.LOG_FOOD, 'Trauben'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1], 4.3), FitBitFoodIds.Fruit.GRAPE]
  },
  {
    meta: [/^birne$/i, Actions.LOG_FOOD, 'Birne'],
    getLogSpecifics: () => [1, FitBitFoodIds.Fruit.BIRNE, FitBitUnitIds.BIRNE_GANZ]
  },
  {
    meta: [/^butter (\d+)$/i, Actions.LOG_FOOD, 'Butter'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1]), FitBitFoodIds.BUTTER, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^buttertoast$/i, Actions.LOG_FOOD, 'Buttertoast (1 Toast, 15g Butter'],
    getLogSpecifics: () => (
      [
        [1, FitBitFoodIds.Backwaren.TOAST, FitBitUnitIds.UNIT],
        [15, FitBitFoodIds.BUTTER, FitBitUnitIds.GRAMM]
      ]
    )
  },
  {
    meta: [/^butterbrot m$/i, Actions.LOG_FOOD, 'Butterbrot Mittel (35g Brot, 15g Butter)'],
    getLogSpecifics: () => (
      [
        [35, FitBitFoodIds.Backwaren.BROT, FitBitUnitIds.GRAMM],
        [15, FitBitFoodIds.BUTTER, FitBitUnitIds.GRAMM]
      ]
    )
  },
  {
    meta: [/^butterbrot l$/i, Actions.LOG_FOOD, 'Butterbrot Groß (50g Brot, 25g Butter)'],
    getLogSpecifics: () => (
      [
        [50, FitBitFoodIds.Backwaren.BROT, FitBitUnitIds.GRAMM],
        [25, FitBitFoodIds.BUTTER, FitBitUnitIds.GRAMM]
      ]
    )
  },
  {
    meta: [/^laugengebäck (\d+)$/i, Actions.LOG_FOOD, 'Laugengebäck mit 298kcal/100g'],
    getLogSpecifics: matchResult => (
      [
        [numberAsStringToInt(matchResult[1]), FitBitFoodIds.Backwaren.LAUGENGEBAECK, FitBitUnitIds.GRAMM]
      ]
    )
  },
  {
    meta: [/^brot (\d+)$/i, Actions.LOG_FOOD, 'Brot. Zur Abschätzung: 1cm dick & Handflächengroß = 45g, jedes Fingerglied mehr/weniger entspricht etwa 5g+-'],
    getLogSpecifics: matchResult => (
      [
        [numberAsStringToInt(matchResult[1]), FitBitFoodIds.Backwaren.BROT, FitBitUnitIds.GRAMM]
      ]
    )
  },
  {
    meta: [/^brot m$/i, Actions.LOG_FOOD, 'Scheibe Brot Mittel (35g)'],
    getLogSpecifics: () => (
      [
        [35, FitBitFoodIds.Backwaren.BROT, FitBitUnitIds.GRAMM]
      ]
    )
  },
  {
    meta: [/^brot l$/i, Actions.LOG_FOOD, 'Scheibe Brot Large (50g)'],
    getLogSpecifics: () => (
      [
        [50, FitBitFoodIds.Backwaren.BROT, FitBitUnitIds.GRAMM]
      ]
    )
  },
  {
    meta: [/^(müsli|fs)$/i, Actions.LOG_FOOD, 'Müsli'],
    getLogSpecifics: () => (
      [
        [60, FitBitFoodIds.Muesli.KLASSIK, FitBitUnitIds.GRAMM],
        [400, FitBitFoodIds.Drinks.MILCH, FitBitUnitIds.ML]
      ]
    )
  },
  {
    meta: [/^müsli (\d+) (\d+)$/i, Actions.LOG_FOOD, 'Müsli with weights'],
    getLogSpecifics: matchResult => (
      [
        [numberAsStringToInt(matchResult[1]), FitBitFoodIds.Muesli.KLASSIK, FitBitUnitIds.GRAMM],
        [numberAsStringToInt(matchResult[2]), FitBitFoodIds.Drinks.MILCH, FitBitUnitIds.ML]
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
        [numberAsStringToInt(matchResult[1]), FitBitFoodIds.Joghurt.Plain.DEFAULT],
        [numberAsStringToInt(matchResult[2]), FitBitFoodIds.Joghurt.Fruit.DEFAULT],
        [numberAsStringToInt(matchResult[3]), FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
  },
  {
    meta: [/^q (\d+) (\d+)$/i, Actions.LOG_FOOD, 'Quark mager=$1 with müsli=$2'],
    getLogSpecifics: matchResult => (
      [
        [numberAsStringToInt(matchResult[1]), FitBitFoodIds.Quark.FETT_MAGER],
        [numberAsStringToInt(matchResult[2]), FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
  },
  {
    meta: [/^q$/i, Actions.LOG_FOOD, 'Quark mager=500g with müsli=25g'],
    getLogSpecifics: matchResult => (
      [
        [500, FitBitFoodIds.Quark.FETT_MAGER],
        [25, FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
  },
  {
    meta: [/^q20$/i, Actions.LOG_FOOD, 'Quark mager=500g, 20%=250g with müsli=25g'],
    getLogSpecifics: matchResult => (
      [
        [500, FitBitFoodIds.Quark.FETT_MAGER],
        [250, FitBitFoodIds.Quark.FETT_20],
        [25, FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
  },
  {
    meta: [/^q40$/i, Actions.LOG_FOOD, 'Quark mager=500g, 40%=250g with müsli=25g'],
    getLogSpecifics: matchResult => (
      [
        [500, FitBitFoodIds.Quark.FETT_MAGER],
        [250, FitBitFoodIds.Quark.FETT_40],
        [25, FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
  },
  {
    meta: [/^q20 (\d+) (\d+) (\d+)$/i, Actions.LOG_FOOD, 'Quark (mager=$1 20=$2) with müsli=$3'],
    getLogSpecifics: matchResult => (
      [
        [numberAsStringToInt(matchResult[1]), FitBitFoodIds.Quark.FETT_MAGER],
        [numberAsStringToInt(matchResult[2]), FitBitFoodIds.Quark.FETT_20],
        [numberAsStringToInt(matchResult[3]), FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
  },
  {
    meta: [/^q40 (\d+) (\d+) (\d+)$/i, Actions.LOG_FOOD, 'Quark (mager=$1 40=$2) with müsli=$3'],
    getLogSpecifics: matchResult => (
      [
        [numberAsStringToInt(matchResult[1]), FitBitFoodIds.Quark.FETT_MAGER],
        [numberAsStringToInt(matchResult[2]), FitBitFoodIds.Quark.FETT_40],
        [numberAsStringToInt(matchResult[3]), FitBitFoodIds.Muesli.DEFAULT]
      ]
    )
  },
  {
    meta: [/^(salat lachs semmel|sls)$/i, Actions.LOG_FOOD, 'Salad with Salmon and Semmel'],
    getLogSpecifics: () => (
      [
        [280, FitBitFoodIds.Salad.EDEKA_KAESE_EI, FitBitUnitIds.GRAMM],
        [125, FitBitFoodIds.Fish.STREMELLACHS, FitBitUnitIds.GRAMM],
        [1, FitBitFoodIds.Backwaren.KARTOFFELSEMMEL, FitBitUnitIds.UNIT]
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
    meta: [/^haribo s$/i, Actions.LOG_FOOD, '4-5 Haribos'],
    getLogSpecifics: () => [25, FitBitFoodIds.Sweets.HARIBO, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^haribo m$/i, Actions.LOG_FOOD, 'Eine mittlere Portion (Weniger als eine Hand voll, aber mehr als paar einzelne'],
    getLogSpecifics: () => [50, FitBitFoodIds.Sweets.HARIBO, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^haribo l$/i, Actions.LOG_FOOD, 'Eine handvoll Haribo Süßigkeiten'],
    getLogSpecifics: () => [75, FitBitFoodIds.Sweets.HARIBO, FitBitUnitIds.GRAMM]
  },
  {
    meta: [/^apfel$/i, Actions.LOG_FOOD, 'Apfel'],
    getLogSpecifics: () => [1, FitBitFoodIds.Fruit.APFEL, FitBitUnitIds.MEDIUM_SIZE]
  },
  {
    meta: [/^(pflaume|pf)$/i, Actions.LOG_FOOD, 'Pflaume'],
    getLogSpecifics: () => [1, FitBitFoodIds.Fruit.PFLAUME, FitBitUnitIds.MEDIUM_SIZE]
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
    meta: [/^kräuterbaguette (\d+)$/i, Actions.LOG_FOOD, 'Scheibe Kräuterbaguette (22G)'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1], 22), FitBitFoodIds.Backwaren.KRAEUTERBAGUETTE]
  },
  {
    meta: [/^baguette (\d+)$/i, Actions.LOG_FOOD, 'Scheibe Baguette (20g)'],
    getLogSpecifics: matchResult => [numberAsStringToInt(matchResult[1]), 20, FitBitFoodIds.Backwaren.BAGUETTE]
  },
  {
    meta: [/^(kaffee|k)$/i, Actions.LOG_FOOD, 'Kaffee'],
    getLogSpecifics: () => [1, FitBitFoodIds.Drinks.COFFEE, FitBitUnitIds.UNIT]
  },
  {
    meta: [/^(weissbier|wb)$/i, Actions.LOG_FOOD, 'Weißbier'],
    getLogSpecifics: () => [1, FitBitFoodIds.Drinks.WEISSBIER, FitBitUnitIds.FLASCHE_500_ML]
  },
  {
    meta: [/^schorle$/i, Actions.LOG_FOOD, 'Schorle'],
    getLogSpecifics: () => [100, FitBitFoodIds.Drinks.APFELSAFT, FitBitUnitIds.ML]
  },
  {
    meta: [/^wein$/i, Actions.LOG_FOOD, 'Ein Glas Rotwein'],
    getLogSpecifics: () => [125, FitBitFoodIds.Drinks.ROTWEIN, FitBitUnitIds.ML]
  },
  {
    meta: [/^(leichtes weissbier|lwb)$/i, Actions.LOG_FOOD, 'Leichtes Weißbier'],
    getLogSpecifics: () => [500, FitBitFoodIds.Drinks.LEICHTES_WEISSBIER, FitBitUnitIds.ML]
  },
  {
    meta: [/^helles$/i, Actions.LOG_FOOD, 'Helles'],
    getLogSpecifics: () => [1, FitBitFoodIds.Drinks.HELLES, FitBitUnitIds.UNIT]
  },
  {
    meta: [/^(cappuccino|c)$/i, Actions.LOG_FOOD, 'Cappuccino'],
    getLogSpecifics: () => [1, FitBitFoodIds.Drinks.CAPPUCCINO, FitBitUnitIds.TASSE_240_ML]
  },
  {
    meta: [/^bionade$/i, Actions.LOG_FOOD, 'Bionade'],
    getLogSpecifics: () => [330, FitBitFoodIds.Drinks.BIONADE, FitBitUnitIds.ML]
  }
]

module.exports = {
  Responses,
  Actions
}
