'use strict';

const FitBitUnitIds = {
  GRAMM: 147,
  GROSS_1: 179, // Genutzt bei Semmel
  MEDIUM_SIZE: 204,
  ML: 209,
  UNIT: 222,
  BIRNE_GANZ: 243,
  STUECK_1: 251,
  PORTION: 304, // Genutzt bei Birne
  TASSE_240_ML: 19984,
  TASSE_180_ML: 20480,
  FLASCHE_500_ML: 20141,
};

const FitBitFoodIds = {
  Backwaren: {
    SEMMEL: 539667661,
    BREZE: 702874810,
    TOAST: 539659257,
  },
  Muesli: {
    DEFAULT: 537212681,
    KLASSIK: 537146259,
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
    APFEL: 2635276,
    BIRNE: 2635120,
    MANDARINE: 537170204
  },
  Drinks: {
    WEISSBIER: 537128064,
    LEICHTES_WEISSBIER: 537128694,
    HELLES: 537169112,
    COFFEE: 539665673,
    CAPPUCCINO: 537189105,
    MILCH: 537191677,
    BIONADE: 537218836,
  },
  Wurst: {
    SALAMI: 537151679
  },
  Kaese: {
    KAESE: 537182183
  },
  BUTTER: 537133257,
  Restaurants: {
    Subway: {
      CHICKEN_TERIYAKI: 537191019,
      CHICKEN_FAJITA: 537155474,
      CHEDDAR_CHEESE: 537202026,
      CHIPOTLE_SAUCE: 537191345,
    }
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
