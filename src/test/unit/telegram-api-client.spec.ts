/* eslint-env node, mocha */
import TelegramAPIClient from '../../handler/telegram-api-client';
import ResponseProcessor from '../../handler/response-processor';

const chai = require('chai');

const { expect } = chai;

describe('TelegramAPIClient', () => {
  it('gets the json payload for a request to the fitbit api', () => {
    const _ = ResponseProcessor.fromMessage;
    expect(_('joghurt').toJSON()[0].foodId).to.eql(537115055);

    expect(_('joghurt 10 20 30').toJSON()[0].foodId).to.eql(537115055);
    expect(_('joghurt 10 20 30').toJSON()[1].foodId).to.eql(544978453);
    expect(_('joghurt 10 20 30').toJSON()[2].foodId).to.eql(537212681);
  });

  it('return null if not matched', () => {
    const _ = TelegramAPIClient.getQueryParamsForFoodLog;
    expect(_('asdasdad')).to.eql(null);
  });
});
