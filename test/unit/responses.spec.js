/* eslint-env node, mocha */

'use strict'

const chai = require('chai')
const moment = require('moment-timezone')
const { ResponseProcessor } = require('../../src/response-processor')
const { FitBitMealTypeIds } = require('../../config/constants')

const expect = chai.expect

describe('Responses', () => {
  describe('getMealTypeByTime', () => {
    it('gets the correct mealType based on time', () => {
      const _ = ResponseProcessor.getMealTypeByTime
      expect(_(moment('00:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
      expect(_(moment('01:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
      expect(_(moment('02:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
      expect(_(moment('03:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
      expect(_(moment('04:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
      expect(_(moment('06:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST)
      expect(_(moment('07:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST)
      expect(_(moment('08:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST)
      expect(_(moment('09:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST)
      expect(_(moment('09:30:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST)
      expect(_(moment('10:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.MORNING_SNACK)
      expect(_(moment('11:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.MORNING_SNACK)
      expect(_(moment('11:30:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH)
      expect(_(moment('12:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH)
      expect(_(moment('13:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH)
      expect(_(moment('13:30:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH)
      expect(_(moment('14:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON)
      expect(_(moment('15:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON)
      expect(_(moment('16:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON)
      expect(_(moment('17:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON)
      expect(_(moment('18:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER)
      expect(_(moment('19:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER)
      expect(_(moment('20:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER)
      expect(_(moment('20:30:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER)
      expect(_(moment('21:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.EVENING_SNACK)
      expect(_(moment('22:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.EVENING_SNACK)
      expect(_(moment('23:00:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.EVENING_SNACK)
      expect(_(moment('23:30:00', 'HH:mm:ss').tz('Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
    })
  })

  describe('convertFoodLogJSONToUserFriendlyText', () => {
    it('correctly converts the json', () => {
      const jsonLog = require('../fixtures/daily-log.json')

      const _ = ResponseProcessor.convertFoodLogJSONToUserFriendlyText
      const result = _(jsonLog)
      // console.log(result)
      expect(result).to.be.a('string')
    })
  })
})
