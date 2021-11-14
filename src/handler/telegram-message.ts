interface MessageJson {
  from: {
    first_name: string
  },
  text: string,
  chat: {
    id: string
  },
  message_id: string
}

export default class TelegramMessage {
  private message: MessageJson;

  constructor(message: MessageJson) {
    this.message = message;
  }

  static getInstance(message: MessageJson) {
    return new TelegramMessage(message);
  }

  static wrapStringInCodeBlock(str: string) {
    return `\`\`\`\n${str}\n\`\`\``;
  }

  getSenderName() {
    return this.message.from.first_name;
  }

  getLowerCaseTextMessage() {
    return this.message.text ? this.message.text.toLowerCase() : null;
  }

  getTextMessageLength() {
    return this.message.text ? this.message.text.length : -1;
  }

  getChatId() {
    return this.message.chat.id;
  }

  getMessageId() {
    return this.message.message_id;
  }
}
