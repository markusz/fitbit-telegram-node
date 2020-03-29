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

  static logTelegramAPIReply (superagentRes) {
    console.log(`status=${superagentRes.status}, messageId=${superagentRes.body.result.message_id}`)
  }

  replyInTelegramChat (message, formatted = true) {
    console.log(`Replying to Telegram with message=${message}`)
    const params = {
      chat_id: this.chatId,
      text: message
    }

    if (formatted) {
      params.parse_mode = 'MarkdownV2'
    }
    return superagent
      .get(`${this.baseURL}/sendMessage`)
      .set('Accept', 'application/json')
      .query(params)
  }

  static getQueryParamsForFoodLog (message) {
    return ResponseProcessor.fromMessage(message).toJSON()
  }
}

module.exports = {
  TelegramApiClient
}
