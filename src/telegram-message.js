'use strict'

class TelegramMessage {
  constructor (message) {
    this.message = message
  }

  static getInstance (message) {
    return new TelegramMessage(message)
  }

  static wrapStringInCodeBlock (str) {
    return '```\n' + str + '\n```'
  }

  getSenderName () {
    return this.message.from.first_name
  }

  getLowerCaseTextMessage () {
    return this.message.text ? this.message.text.toLowerCase() : null
  }

  getTextMessageLength () {
    return this.message.text ? this.message.text.length : -1
  }

  getChatId () {
    return this.message.chat.id
  }

  getMessageId () {
    return this.message.message_id
  }
}

module.exports = {
  TelegramMessage
}
