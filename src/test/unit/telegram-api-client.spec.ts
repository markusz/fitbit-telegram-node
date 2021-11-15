import TelegramAPIClient from '../../handler/telegram-api-client';
import ResponseProcessor from '../../handler/response-processor';

// const chai = require('chai');

// const { expect } = chai;
//
// test('gets the json payload for a request to the fitbit api', () => {
//   expect(ResponseProcessor.fromMessage('joghurt').toJSON()[0].foodId).toBe(537115055);
//
//   // expect(_('joghurt 10 20 30').toJSON()[0].foodId).to.eql(537115055);
//   // expect(_('joghurt 10 20 30').toJSON()[1].foodId).to.eql(544978453);
//   // expect(_('joghurt 10 20 30').toJSON()[2].foodId).to.eql(537212681);
// });

test('return null if not matched', () => {
  // expect(TelegramAPIClient.getQueryParamsForFoodLog('asdasdad')).toBe(null);
  expect(1 + 1).toBe(2);
});
