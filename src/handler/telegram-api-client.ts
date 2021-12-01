import superagent from 'superagent';
import ResponseProcessor, { ILogRequest } from './response-processor';

export default class TelegramApiClient {
  private readonly botToken: string;

  private readonly chatId: string;

  private baseURL: string;

  constructor(botToken: string, chatId: string) {
    this.botToken = botToken;
    this.chatId = chatId;
    this.baseURL = `https://api.telegram.org/bot${this.botToken}`;
  }

  static getInstance(botToken: string, chatId: string) {
    return new TelegramApiClient(botToken, chatId);
  }

  static logTelegramAPIReply(superagentRes: any) {
    console.log(`status=${superagentRes.status}, messageId=${superagentRes.body.result.message_id}`);
  }

  replyInTelegramChat(message: string, formatted: boolean = true) {
    console.log(`Replying to Telegram with message=${message}`);
    const params = {
      chat_id: this.chatId,
      text: message,
    };

    if (formatted) {
      // @ts-ignore
      params.parse_mode = 'MarkdownV2';
    }
    return superagent
      .get(`${this.baseURL}/sendMessage`)
      .set('Accept', 'application/json')
      .query(params);
  }

  static getQueryParamsForFoodLog(message: string): ILogRequest | null {
    return ResponseProcessor.fromMessage(message).toJSON();
  }
}
