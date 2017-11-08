/* eslint-env node, mocha */

'use strict';

const chai = require('chai');
const TelegramAPIClient = require('../src/telegram-api-client').TelegramApiClient;

const expect = chai.expect;

describe('TelegramAPIClient', () => {
  it('should get the correct responses for messages', () => {
    const _ = TelegramAPIClient.getResponseForMessage;
    expect(_('joghurt').title).to.eql('Joghurt');
    expect(_('joghurt').title).to.eql('Joghurt');
    expect(_('apfel').title).to.eql('Apfel');
    expect(_('kaffee').title).to.eql('Kaffee');
    expect(_('cappuccino').title).to.eql('Cappuccino');
    expect(_('joghurt 10 20 30').title).to.eql('Joghurt with weights');
  });

  it('return null if not matched', () => {
    const _ = TelegramAPIClient.getResponseForMessage;
    expect(_('asdasdad')).to.eql(undefined);
  });
});
