'use strict'

const superagent = require('superagent')
const { ResponseProcessor } = require('../src/response-processor')

class TelegramApiClient {
  constructor (botToken, chatId) {
    this.botToken = botToken
    this.chatId = chatId
    this.baseURL = `https://api.telegram.org/bot${this.botToken}`
  }

  static getInstance (botToken, chatId) {
    return new TelegramApiClient(botToken, chatId)
  }

  replyInTelegramChat (message) {
    console.log(`Called with ${message}`)
    return superagent.get(`${this.baseURL}/sendMessage`)
      .query({
        chat_id: this.chatId,
        text: message
      })
  }

  static getQueryParamsForFoodLog (message) {
    return ResponseProcessor.fromMessage(message).toJSON()
  }
}

module.exports = {
  TelegramApiClient
}
