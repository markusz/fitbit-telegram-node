/* eslint-env node, mocha */

'use strict'

const chai = require('chai')
const TelegramAPIClient = require('../src/telegram-api-client').TelegramApiClient
const { ResponseProcessor } = require('../src/response-processor')

const expect = chai.expect

describe('TelegramAPIClient', () => {
  it('gets the json payload for a request to the fitbit api', () => {
    const _ = ResponseProcessor.fromMessage
    expect(_('joghurt').toJSON()[0].foodId).to.eql(537115055)

    expect(_('joghurt 10 20 30').toJSON()[0].foodId).to.eql(537115055)
    expect(_('joghurt 10 20 30').toJSON()[1].foodId).to.eql(544978453)
    expect(_('joghurt 10 20 30').toJSON()[2].foodId).to.eql(537212681)
  })

  it('return null if not matched', () => {
    const _ = TelegramAPIClient.getQueryParamsForFoodLog
    expect(_('asdasdad')).to.eql(null)
  })
})
