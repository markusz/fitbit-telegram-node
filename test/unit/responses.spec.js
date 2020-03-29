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
      expect(_(moment.tz('00:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
      expect(_(moment.tz('01:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
      expect(_(moment.tz('02:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
      expect(_(moment.tz('03:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
      expect(_(moment.tz('04:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
      expect(_(moment.tz('06:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST)
      expect(_(moment.tz('07:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST)
      expect(_(moment.tz('08:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST)
      expect(_(moment.tz('09:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST)
      expect(_(moment.tz('09:30:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.BREAKFAST)
      expect(_(moment.tz('10:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.MORNING_SNACK)
      expect(_(moment.tz('11:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.MORNING_SNACK)
      expect(_(moment.tz('11:30:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH)
      expect(_(moment.tz('12:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH)
      expect(_(moment.tz('13:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH)
      expect(_(moment.tz('13:30:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.LUNCH)
      expect(_(moment.tz('14:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON)
      expect(_(moment.tz('15:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON)
      expect(_(moment.tz('16:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON)
      expect(_(moment.tz('17:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.AFTERNOON)
      expect(_(moment.tz('18:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER)
      expect(_(moment.tz('19:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER)
      expect(_(moment.tz('20:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER)
      expect(_(moment.tz('20:30:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.DINNER)
      expect(_(moment.tz('21:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.EVENING_SNACK)
      expect(_(moment.tz('22:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.EVENING_SNACK)
      expect(_(moment.tz('23:00:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.EVENING_SNACK)
      expect(_(moment.tz('23:30:00', 'HH:mm:ss', 'Europe/Berlin'))).to.eql(FitBitMealTypeIds.ANYTIME)
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

  describe('getPossibleCommands', () => {
    it('correctly lists commands', () => {
      const _ = ResponseProcessor.getPossibleCommands
      const result = _()
      // console.log(result)
      expect(result).to.be.a('string')
    })
  })
})
