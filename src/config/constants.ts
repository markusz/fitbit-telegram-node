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
    BAGUETTE: 537155337,
    KARTOFFELSEMMEL: 537166438,
    BREZE: 702874810,
    TOAST: 539659257,
    BROT: 537181422,
    LAUGENGEBAECK: 728053350,
    KRAEUTERBAGUETTE: 734745119,
  },
  Muesli: {
    DEFAULT: 537212681,
    KLASSIK: 537146259,
    HONIG_NUSS: 537212681,
    SCHOKO_KEKS: 537128067,
  },
  Quark: {
    FETT_20: 537116107,
    FETT_40: 691777822,
    FETT_MAGER: 537214525,
  },
  Joghurt: {
    Plain: {
      DEFAULT: 537115055,
      P_01: 537115055,
    },
    Fruit: {
      DEFAULT: 544978453,
      P_01: 544978453,
    },
  },
  Salad: {
    EDEKA_KAESE_EI: 541881753,
  },
  Vegetables: {
    KARTOFFELN_GEKOCHT: 537219908,
  },
  Fruit: {
    APFEL: 2635276,
    PFLAUME: 2636614,
    BIRNE: 2635120,
    MANDARINE: 537170204,
    GRAPE: 537192015,
  },
  Drinks: {
    WEISSBIER: 537128064,
    LEICHTES_WEISSBIER: 537128694,
    HELLES: 537169112,
    COFFEE: 537126413,
    CAPPUCCINO: 537189105,
    MILCH: 537191677,
    BIONADE: 537218836,
    APFELSAFT: 2635570,
    ROTWEIN: 2634414,
  },
  Wurst: {
    SALAMI: 537151679,
    SCHINKEN: 2635922,
  },
  Kaese: {
    KAESE: 735679015,
  },
  Fish: {
    STREMELLACHS: 537113635,
  },
  Sweets: {
    HARIBO: 539657890,
  },
  BUTTER: 537133257,
  NUDELN: 537155075,
  REIS: 537246167,
  Restaurants: {
    Subway: {
      CHICKEN_TERIYAKI: 537191019,
      CHICKEN_FAJITA: 537155474,
      CHEDDAR_CHEESE: 537202026,
      CHIPOTLE_SAUCE: 537191345,
    },
  },
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

export {
  FitBitUnitIds,
  FitBitMealTypeIds,
  FitBitFoodIds,
};