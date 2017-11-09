'use strict';

const FitBitUnitIds = {
  GRAMM: 147,
  UNIT: 222,
  TASSE_240_ML: 19984
};

const FitBitFoodIds = {
  Muesli: {
    DEFAULT: 537212681,
    HONIG_NUSS: 537212681,
    SCHOKO_KEKS: 537128067,
  },
  Joghurt: {
    Plain: {
      DEFAULT: 537115055,
      P_01: 537115055,
    },
    Fruit: {
      DEFAULT: 544978453,
      P_01: 544978453,
    }
  },
  Fruit: {
    APPLE: 537116516
  },
  Drinks: {
    WEISSBIER: 537128064,
    COFFEE: 539665673,
    CAPPUCCINO: 537189105
  }
};

const FitBitMealTypeIds = {
  BREAKFAST: 1,
  MORNING_SNACK: 2,
  LUNCH: 3,
  AFTERNOON: 4,
  DINNER: 5,
  EVENING_SNACK: 6,
  ANYTIME: 7,
};

module.exports = {
  FitBitUnitIds,
  FitBitMealTypeIds,
  FitBitFoodIds
};
