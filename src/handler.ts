import AWS from 'aws-sdk';

import lodash from 'lodash';

import moment from 'moment-timezone';

import { APIGatewayProxyEvent } from 'aws-lambda';
import { readFile } from 'fs/promises';
import { DocumentClient } from 'aws-sdk/lib/dynamodb/document_client';
import TelegramMessage from './handler/telegram-message';
import TelegramApiClient from './handler/telegram-api-client';
import FitBitApiClient from './handler/fitbit-api-client';
import ResponseProcessor from './handler/response-processor';

interface DynamoDBOAuthItem {
  chatId: number,
  userId: string,
  accessToken: string
}

const dynamoDbClient: DocumentClient = new AWS.DynamoDB.DocumentClient({
  apiVersion: '2012-08-10',
  region: process.env.AWS_REGION,
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

const MESSAGE_RETRIEVAL_CONFIRMATION = { statusCode: 200 };

const storeAccessTokenInDynamoDB = (event: APIGatewayProxyEvent) => {
  const accessToken = lodash.get(event, 'queryStringParameters.access_token');
  const userId = lodash.get(event, 'queryStringParameters.user_id');
  const chatId = parseInt(lodash.get(event, 'queryStringParameters.state'), 10);

  return dynamoDbClient.put({
    TableName: process.env.DYNAMODB_TABLE!,
    Item: {
      chatId,
      userId,
      accessToken,
    },
  }).promise();
};

const getAccessTokenForChatId = (chatId: string) => dynamoDbClient.get({
  TableName: process.env.DYNAMODB_TABLE!,
  Key: {
    chatId,
  },
}).promise();

const makeOAuthURLForInitMessage = (telegramMessage: TelegramMessage) => {
  // https://stackoverflow.com/questions/60130062/escaped-character-on-telegram-bot-api-4-5-markdownv2-gives-trouble-for-hyper-lin
  const redirectURI = `https://${process.env.BASE_URL!}`;
  const scope = 'nutrition';

  return `https://www.fitbit.com/oauth2/authorize?response_type=token&expires_in=31536000&client_id=${process.env.CLIENT_ID!}&redirect_uri=${redirectURI}&scope=${scope}&state=${telegramMessage.getChatId()}`;
};

export async function StaticRedirectPage() {
  const template = await readFile('./index.html');
  const htmlPage = template.toString().replace('BASE_URL', process.env.BASE_URL!);

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/html',
    },

    body: htmlPage,
  };
}

export async function FitbitOAuthResponseHandler(event: APIGatewayProxyEvent) {
  const eventAsString = JSON.stringify(event);
  console.log(eventAsString);

  try {
    const request = await storeAccessTokenInDynamoDB(event);
    console.log(request);
    return {
      statusCode: 200,
      headers: {
        'cache-control-header1': 1000,
        'cache-control-header2': 1000,
      },
    };
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ status: 'Error', error: e }),
    };
  }
}

export async function TelegramMealReminder() {
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN!, process.env.TELEGRAM_CHAT_ID!);

  const dynamoDBItem = await getAccessTokenForChatId(process.env.TELEGRAM_CHAT_ID!);
  const { accessToken } = dynamoDBItem.Item as DynamoDBOAuthItem;
  console.log(accessToken);

  const foodLog = await new FitBitApiClient(accessToken).getFoodLog();
  const telegramAPIReply = await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(foodLog.body));

  console.log(`telegram-resp=${JSON.stringify(telegramAPIReply)}`);
  return MESSAGE_RETRIEVAL_CONFIRMATION;
}

export async function SurplusTransferer() {
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN!, process.env.TELEGRAM_CHAT_ID!);
  const dynamoDBItem = await getAccessTokenForChatId(process.env.TELEGRAM_CHAT_ID!);

  const { accessToken } = dynamoDBItem.Item as DynamoDBOAuthItem;
  const fitBitApiClient = new FitBitApiClient(accessToken);

  console.log(`accessToken=${accessToken}`);

  const yesterdayString = moment.tz('Europe/Berlin').subtract(1, 'days').format('YYYY-MM-DD');
  console.log(`dayString=${yesterdayString}`);
  const foodLogY = (await fitBitApiClient.getFoodLog(yesterdayString)).body;
  console.log(foodLogY);

  const loggedY = foodLogY.summary.calories;
  const goalFromFoodLog = lodash.get(foodLogY, 'goals.calories', -1);
  if (goalFromFoodLog < 0) {
    console.log(`Calorie goal is missing in foodLog for ${yesterdayString}, querying goal API directly`);
  }

  const goalY = goalFromFoodLog > 0 ? goalFromFoodLog : (await fitBitApiClient.getGoals()).body.goals.calories;
  console.log(`goalY=${goalY}`);
  const surplusY = loggedY - goalY;
  console.log(`delta=${surplusY}`);

  // <0 means in budget and no carry over required, >1000 indicates something irregular or forgot to log -> better handle this manually
  if (surplusY > 0 && surplusY <= 1000) {
    const queryParams = ResponseProcessor.getLogRequestParamsForCalories(surplusY, `∆ ${yesterdayString}`);
    await fitBitApiClient.logFood(queryParams);
    const logs = await fitBitApiClient.getFoodLog();
    await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(logs.body));
  }

  return MESSAGE_RETRIEVAL_CONFIRMATION;
}

export async function TelegramMessageHandler(event: APIGatewayProxyEvent) {
  // SECURITY_TOKEN ensures that only calls from the Telegram Webhook are allowed
  const token = lodash.get(event, 'pathParameters.token');
  if (process.env.SECURITY_TOKEN !== token) {
    console.error(`Request declined. token=${token}`);
    return MESSAGE_RETRIEVAL_CONFIRMATION;
  }

  const message = lodash.get(JSON.parse(event.body!), 'message');

  if (message === undefined) {
    console.log(`Failed to retrieve message from body ${JSON.parse(event.body!)}`);
    return MESSAGE_RETRIEVAL_CONFIRMATION;
  }

  const telegramMessage = TelegramMessage.getInstance(message);

  console.log(`chatId=${telegramMessage.getChatId()}`);
  console.log(`messageId=${telegramMessage.getMessageId()}`);
  console.log(`message=${telegramMessage.getLowerCaseTextMessage()}`);

  const dynamoDBItem = await getAccessTokenForChatId(telegramMessage.getChatId());
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN!, telegramMessage.getChatId());

  const { accessToken, userId } = dynamoDBItem.Item as DynamoDBOAuthItem;

  console.log(`userId=${userId}`);
  console.log(`accessToken=${accessToken}`);

  const fitBitApiClient = new FitBitApiClient(accessToken);
  const msg = telegramMessage.getLowerCaseTextMessage()!;

  try {
    switch (msg) {
      case msg.match(/^init$/)?.input: {
        console.log('command=init-flow');
        const url = makeOAuthURLForInitMessage(telegramMessage);
        TelegramApiClient.logTelegramAPIReply(await telegramApiClient.replyInTelegramChat(url, false));
        break;
      }
      case msg.match(/^commands$/)?.input: {
        console.log('command=get-commands');
        const possibleCommands = ResponseProcessor.getPossibleCommands();
        TelegramApiClient.logTelegramAPIReply(await telegramApiClient.replyInTelegramChat(possibleCommands));
        break;
      }
      case msg.match(/^log$/)?.input: {
        console.log('command=get-log');
        const foodLog = await fitBitApiClient.getFoodLog();
        TelegramApiClient.logTelegramAPIReply(await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(foodLog.body)));
        break;
      }
      default: {
        const queryParams = TelegramApiClient.getQueryParamsForFoodLog(telegramMessage.getLowerCaseTextMessage()!);
        if (queryParams !== null) {
          console.log('command=log-item');
          await fitBitApiClient.logFood(queryParams);
          const logs = await fitBitApiClient.getFoodLog();
          TelegramApiClient.logTelegramAPIReply(await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(logs.body)));
        } else {
          console.log('command=not-understood');
          TelegramApiClient.logTelegramAPIReply(await telegramApiClient.replyInTelegramChat('```\nCommand not understood\n```'));
        }
        break;
      }
    }

    return MESSAGE_RETRIEVAL_CONFIRMATION;
  } catch (e) {
    await telegramApiClient.replyInTelegramChat('```\nServer Error\n```');
    return MESSAGE_RETRIEVAL_CONFIRMATION;
  }
}
