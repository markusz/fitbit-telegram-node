// /* eslint-env node, mocha */
//
// import chai from 'chai';
//
// import moment from 'moment-timezone';
// import ResponseProcessor from '../../handler/response-processor';
//
// const jsonLog = require('../fixtures/daily-log.json');
//
// const { FitBitMealTypeIds } = require('../../config/constants');
//
// const { expect } = chai;
//
// describe('Responses', () => {
//   describe('getMealTypeByTime', () => {
//     it('gets the correct mealType based on time', () => {
//       const _: Function = ResponseProcessor.getMealTypeByTime;
//       expect(_(moment.tz('00:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME);
//       expect(_(moment.tz('01:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME);
//       expect(_(moment.tz('02:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME);
//       expect(_(moment.tz('03:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME);
//       expect(_(moment.tz('04:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME);
//       expect(_(moment.tz('06:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST);
//       expect(_(moment.tz('07:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST);
//       expect(_(moment.tz('08:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST);
//       expect(_(moment.tz('09:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST);
//       expect(_(moment.tz('09:30:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST);
//       expect(_(moment.tz('10:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.MORNING_SNACK);
//       expect(_(moment.tz('11:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.MORNING_SNACK);
//       expect(_(moment.tz('11:30:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH);
//       expect(_(moment.tz('12:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH);
//       expect(_(moment.tz('13:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH);
//       expect(_(moment.tz('13:30:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH);
//       expect(_(moment.tz('14:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON);
//       expect(_(moment.tz('15:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON);
//       expect(_(moment.tz('16:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON);
//       expect(_(moment.tz('17:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON);
//       expect(_(moment.tz('18:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER);
//       expect(_(moment.tz('19:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER);
//       expect(_(moment.tz('20:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER);
//       expect(_(moment.tz('20:30:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER);
//       expect(_(moment.tz('21:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.EVENING_SNACK);
//       expect(_(moment.tz('22:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.EVENING_SNACK);
//       expect(_(moment.tz('23:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.EVENING_SNACK);
//       expect(_(moment.tz('23:30:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME);
//     });
//   });
//
//   describe('convertFoodLogJSONToUserFriendlyText', () => {
//     it('correctly converts the json', () => {
//       const _ = ResponseProcessor.convertFoodLogJSONToUserFriendlyText;
//       const result = _(jsonLog);
//       // console.log(result)
//       expect(result).to.be.a('string');
//     });
//   });
//
//   describe('getPossibleCommands', () => {
//     it('correctly lists commands', () => {
//       const _ = ResponseProcessor.getPossibleCommands;
//       const result = _();
//       // console.log(result)
//       expect(result).to.be.a('string');
//     });
//   });
// });

import ResponseProcessor from '../../handler/response-processor';

test('correctly lists commands', () => {
  // const _ = ResponseProcessor.getPossibleCommands;
  // const result = _();
  // console.log(result)
  // expect(2).toBeGreaterThan(3);
  expect(ResponseProcessor.getPossibleCommands()).toBe('');
});
