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
});

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true,
};

const MESSAGE_RETRIEVAL_CONFIRMATION = { statusCode: 200 };

const storeAccessTokenInDynamoDB = (event: APIGatewayProxyEvent) => dynamoDbClient.put({
  TableName: process.env.DYNAMODB_TABLE!,
  Item: {
    chatId: parseInt(event.queryStringParameters!.state!, 10),
    userId: event.queryStringParameters!.user_id,
    accessToken: event.queryStringParameters!.access_token,
  },
}).promise();

const getOAuthDetailsForChatId = (chatId: string) => dynamoDbClient.get({
  TableName: process.env.DYNAMODB_TABLE!,
  Key: {
    chatId: parseInt(chatId, 10),
  },
}).promise();

const logActivity = (calories: number, chatId: string) => dynamoDbClient.put({
  TableName: process.env.LOG_TABLE!,
  Item: {
    pk: `Activity_${chatId}_${moment.tz('Europe/Berlin').format('YYYYMMDD')}`,
    sk: Date.now().toString(),
    calories,
  },
}).promise();

const getActivities = (chatId: string, date: string = moment.tz('Europe/Berlin').format('YYYYMMDD')) => dynamoDbClient.query({
  TableName: process.env.LOG_TABLE!,
  KeyConditionExpression: 'pk = :pk',
  ExpressionAttributeValues: {
    ':pk': `Activity_${chatId}_${date}`,
  },
  ProjectionExpression: 'calories',
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
      headers: CORS_HEADERS,
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

  const authInfoDbObject = await getOAuthDetailsForChatId(process.env.TELEGRAM_CHAT_ID!);
  const { accessToken } = authInfoDbObject.Item as DynamoDBOAuthItem;
  console.log(accessToken);

  const foodLog = await new FitBitApiClient(accessToken).getFoodLog();
  const telegramAPIReply = await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(foodLog.body));

  console.log(`telegram-resp=${JSON.stringify(telegramAPIReply)}`);
  return MESSAGE_RETRIEVAL_CONFIRMATION;
}

export async function SurplusTransferer() {
  const chatId = process.env.TELEGRAM_CHAT_ID!;
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN!, chatId);
  const authInfoDbObject = await getOAuthDetailsForChatId(chatId);

  const { accessToken } = authInfoDbObject.Item as DynamoDBOAuthItem;
  const fitBitApiClient = new FitBitApiClient(accessToken);

  console.log(`accessToken=${accessToken}`);

  const yesterday = moment.tz('Europe/Berlin').subtract(1, 'days');

  const yesterdayString = yesterday.format('YYYY-MM-DD');
  const foodLogYesterday = (await fitBitApiClient.getFoodLog(yesterdayString)).body;

  const kcalLoggedYesterday = foodLogYesterday.summary.calories;
  console.log(`kcalLoggedYesterday=${kcalLoggedYesterday}`);
  const goalFromFoodLog = lodash.get(foodLogYesterday, 'goals.calories', -1);
  if (goalFromFoodLog < 0) {
    console.log(`Calorie goal is missing in foodLog for ${yesterdayString}, querying goal API directly`);
  }

  const kcalGoalYesterday = goalFromFoodLog > 0 ? goalFromFoodLog : (await fitBitApiClient.getGoals()).body.goals.calories;

  const activities = await getActivities(chatId, yesterday.format('YYYYMMDD'));
  const activityBalanceYesterday = activities.Items?.map((a) => a.calories).reduce((a, b) => a + b, 0);
  console.log(`kcalGoalYesterday=${kcalGoalYesterday}`);
  console.log(`activityBalance=${activityBalanceYesterday}`);
  const kcalSurplusYesterday = kcalLoggedYesterday - (kcalGoalYesterday + activityBalanceYesterday);
  console.log(`delta=${kcalSurplusYesterday}`);

  // <0 means in budget and no carry over required, >1000 indicates something irregular or forgot to log -> better handle this manually
  if (kcalSurplusYesterday > 0 && kcalSurplusYesterday <= 1000) {
    const queryParams = ResponseProcessor.getLogRequestParamsForCalories(kcalSurplusYesterday, `∆ ${yesterdayString}`);
    await fitBitApiClient.logFood(queryParams);
    const logs = await fitBitApiClient.getFoodLog();
    await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(logs.body));
  }

  return MESSAGE_RETRIEVAL_CONFIRMATION;
}

export async function TelegramMessageHandler(event: APIGatewayProxyEvent) {
  // SECURITY_TOKEN ensures that only calls from the Telegram Webhook are allowed
  if (process.env.SECURITY_TOKEN !== event.pathParameters!.token) {
    console.error(`Request declined. token=${event.pathParameters!.token}`);
    return MESSAGE_RETRIEVAL_CONFIRMATION;
  }

  const { message } = JSON.parse(event.body!);

  if (message === undefined) {
    console.log(`Failed to retrieve message from body ${JSON.parse(event.body!)}`);
    return MESSAGE_RETRIEVAL_CONFIRMATION;
  }

  const telegramMessage = TelegramMessage.getInstance(message);

  console.log(`chatId=${telegramMessage.getChatId()},messageId=${telegramMessage.getMessageId()},message=${telegramMessage.getLowerCaseTextMessage()}`);

  const authInfoDbObject = await getOAuthDetailsForChatId(telegramMessage.getChatId());
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN!, telegramMessage.getChatId());

  const { accessToken, userId } = authInfoDbObject.Item as DynamoDBOAuthItem;

  console.log(`userId=${userId}`);
  console.log(`accessToken=${accessToken}`);

  const fitBitApiClient = new FitBitApiClient(accessToken);
  const rawTextMessage = telegramMessage.getLowerCaseTextMessage()!;

  async function getLogsAndActivity() {
    const logs = await fitBitApiClient.getFoodLog();
    const activities = await getActivities(telegramMessage.getChatId());
    const activityBalance = activities.Items?.map((a) => a.calories).reduce((a, b) => a + b, 0);
    return { logs, activityBalance };
  }

  try {
    switch (rawTextMessage) {
      // .match() returns null if not matching - .input is only defined when the RegExp matches
      case rawTextMessage.match(/^init$/)?.input: {
        console.log('command=init-flow');
        const url = makeOAuthURLForInitMessage(telegramMessage);
        await telegramApiClient.replyInTelegramChat(url, false);
        break;
      }
      case rawTextMessage.match(/^aktiv (-?\d+)$/)?.input: {
        console.log('command=activity');
        const caloriesFromActivity = parseInt(rawTextMessage.match(/^aktiv (-?\d+)/)![1], 10);
        await logActivity(caloriesFromActivity, telegramMessage.getChatId());
        const { logs, activityBalance } = await getLogsAndActivity();
        await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(logs.body, activityBalance));
        break;
      }
      case rawTextMessage.match(/^commands$/)?.input: {
        console.log('command=get-commands');
        const possibleCommands = ResponseProcessor.getPossibleCommands();
        await telegramApiClient.replyInTelegramChat(possibleCommands);
        break;
      }
      case rawTextMessage.match(/^log$/)?.input: {
        console.log('command=get-log');
        const { logs, activityBalance } = await getLogsAndActivity();
        TelegramApiClient.logTelegramAPIReply(await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(logs.body, activityBalance)));
        break;
      }
      default: {
        const queryParams = TelegramApiClient.getQueryParamsForFoodLog(telegramMessage.getLowerCaseTextMessage()!);
        if (queryParams !== null) {
          console.log('command=log-item');
          await fitBitApiClient.logFood(queryParams);
          const { logs, activityBalance } = await getLogsAndActivity();
          await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(logs.body, activityBalance));
        } else {
          console.log('command=not-understood');
          await telegramApiClient.replyInTelegramChat('```\nCommand not understood\n```');
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
