'use strict'

/* eslint-disable eqeqeq */
// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
const AWS = require('aws-sdk')
const lodash = require('lodash')
const moment = require('moment-timezone')

const { TelegramMessage } = require('./src/telegram-message')
const { TelegramApiClient } = require('./src/telegram-api-client')
const { FitBitApiClient } = require('./src/fitbit-api-client')
const { ResponseProcessor } = require('./src/response-processor')

const dynamoDB = new AWS.DynamoDB({ apiVersion: '2012-08-10' })

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': true
}

const MESSAGE_RETRIEVAL_CONFIRMATION = { statusCode: 200 }

const storeAccessTokenInDynamoDB = (event) => {
  const accessToken = lodash.get(event, 'queryStringParameters.access_token')
  const userId = lodash.get(event, 'queryStringParameters.user_id')
  const chatId = lodash.get(event, 'queryStringParameters.state')

  return dynamoDB.putItem({
    TableName: process.env.DYNAMODB_TABLE,
    Item: {
      chatId: { N: chatId },
      userId: { S: userId },
      accessToken: { S: accessToken }
    }
  }).promise()
}

const getAccessTokenForChatId = (chatId) => {
  const params = {
    TableName: process.env.DYNAMODB_TABLE,
    Key: {
      chatId: { N: `${chatId}` }
    }
  }

  return dynamoDB.getItem(params).promise()
}

const makeOAuthURLForInitMessage = (telegramMessage) => {
  const redirectURI = 'https://s3.eu-west-1.amazonaws.com/fitbit-telegram-bridge/index.html'
  const scope = 'nutrition'

  return `https://www.fitbit.com/oauth2/authorize?response_type=token&expires_in=31536000&client_id=${process.env.CLIENT_ID}&redirect_uri=${redirectURI}&scope=${scope}&state=${telegramMessage.getChatId()}`
}

exports.FitbitOAuthResponseHandler = async function (event, context) {
  const eventAsString = JSON.stringify(event)
  console.log(eventAsString)

  try {
    const request = await storeAccessTokenInDynamoDB(event)
    console.log(request)
    return {
      statusCode: 200,
      headers: {
        'cache-control-header1': 1000,
        'cache-control-header2': 1000
      }
    }
  } catch (e) {
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({ status: 'Error', error: e })
    }
  }
}

exports.TelegramMealReminder = async function (event, context) {
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN, process.env.TELEGRAM_CHAT_ID)

  const dynamoDBItem = await getAccessTokenForChatId(process.env.TELEGRAM_CHAT_ID)
  const accessToken = lodash.get(dynamoDBItem, 'Item.accessToken.S')

  const foodLog = await new FitBitApiClient(accessToken).getFoodLog()
  const telegramAPIReply = await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(foodLog.body))

  console.log(`telegram-resp=${JSON.stringify(telegramAPIReply)}`)
  return MESSAGE_RETRIEVAL_CONFIRMATION
}

exports.SurplusTransferer = async function (event, context) {
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN, process.env.TELEGRAM_CHAT_ID)
  const dynamoDBItem = await getAccessTokenForChatId(process.env.TELEGRAM_CHAT_ID)

  const accessToken = lodash.get(dynamoDBItem, 'Item.accessToken.S')
  const fitBitApiClient = new FitBitApiClient(accessToken)

  console.log(`accessToken=${accessToken}`)

  const yesterdayString = moment.tz('Europe/Berlin').subtract(1, 'days').format('YYYY-MM-DD')
  console.log(`dayString=${yesterdayString}`)
  const foodLogY = (await fitBitApiClient.getFoodLog(yesterdayString)).body
  console.log(foodLogY)

  const loggedY = foodLogY.summary.calories
  const goalFromFoodLog = lodash.get(foodLogY, 'goals.calories', -1)
  if (goalFromFoodLog < 0) {
    console.log(`Calorie goal is missing in foodLog for ${yesterdayString}, querying goal API directly`)
  }

  const goalY = goalFromFoodLog > 0 ? goalFromFoodLog : (await fitBitApiClient.getGoals()).body.goals.calories
  console.log(`goalY=${goalY}`)
  const surplusY = loggedY - goalY
  console.log(`delta=${surplusY}`)

  // <0 means in budget and no carry over required, >1000 indicates something irregular or forgot to log -> better handle this manually
  if (surplusY > 0 && surplusY <= 1000) {
    const queryParams = ResponseProcessor.getLogRequestParamsForCalories(surplusY, `∆ ${yesterdayString}`)
    await fitBitApiClient.logFood(queryParams)
    const logs = await fitBitApiClient.getFoodLog()
    await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(logs.body))
    await telegramApiClient.replyInTelegramChat(TelegramMessage.wrapStringInCodeBlock(`Yesterday's budget exceeded by ${surplusY}. Time to pay.`))
  }

  return MESSAGE_RETRIEVAL_CONFIRMATION
}

exports.TelegramMessageHandler = async function (event, context) {
  // SECURITY_TOKEN ensures that only calls from the Telegram Webhook are allowed
  const token = lodash.get(event, 'pathParameters.token')
  if (process.env.SECURITY_TOKEN != token) {
    console.error(`Request declined. token=${token}`)
    return MESSAGE_RETRIEVAL_CONFIRMATION
  }

  const message = lodash.get(JSON.parse(event.body), 'message')
  const telegramMessage = TelegramMessage.getInstance(message)

  console.log(`chatId=${telegramMessage.getChatId()}`)
  console.log(`messageId=${telegramMessage.getMessageId()}`)
  console.log(`message=${telegramMessage.getLowerCaseTextMessage()}`)

  const dynamoDBItem = await getAccessTokenForChatId(telegramMessage.getChatId())
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN, telegramMessage.getChatId())

  const userId = lodash.get(dynamoDBItem, 'Item.userId.S')
  const accessToken = lodash.get(dynamoDBItem, 'Item.accessToken.S')

  console.log(`userId=${userId}`)
  console.log(`accessToken=${accessToken}`)

  const fitBitApiClient = new FitBitApiClient(accessToken)

  try {
    const queryParams = TelegramApiClient.getQueryParamsForFoodLog(telegramMessage.getLowerCaseTextMessage())
    if (queryParams) {
      console.log('command=log-food')
      await fitBitApiClient.logFood(queryParams)
      const logs = await fitBitApiClient.getFoodLog()
      const telegramAPIReply = await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(logs.body))
      TelegramApiClient.logTelegramAPIReply(telegramAPIReply)
    } else {
      if (telegramMessage.getLowerCaseTextMessage() === 'init') {
        console.log('command=init-flow')
        const url = makeOAuthURLForInitMessage(telegramMessage)
        const telegramAPIReply = await telegramApiClient.replyInTelegramChat(url)
        TelegramApiClient.logTelegramAPIReply(telegramAPIReply)
        return MESSAGE_RETRIEVAL_CONFIRMATION
      }

      if (telegramMessage.getLowerCaseTextMessage() === 'commands') {
        console.log('command=get-commands')
        const telegramAPIReply = await telegramApiClient.replyInTelegramChat(ResponseProcessor.getPossibleCommands())
        TelegramApiClient.logTelegramAPIReply(telegramAPIReply)
        return MESSAGE_RETRIEVAL_CONFIRMATION
      }

      if (telegramMessage.getLowerCaseTextMessage() === 'log') {
        console.log('command=get-log')
        const foodLog = await fitBitApiClient.getFoodLog()
        const telegramAPIReply = await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(foodLog.body))
        TelegramApiClient.logTelegramAPIReply(telegramAPIReply)
        return MESSAGE_RETRIEVAL_CONFIRMATION
      }

      console.log('command=not-understood')
      const telegramAPIReply = await telegramApiClient.replyInTelegramChat('```\nCommand not understood\n```')
      TelegramApiClient.logTelegramAPIReply(telegramAPIReply)
    }
    return MESSAGE_RETRIEVAL_CONFIRMATION
  } catch (e) {
    console.error(e)
    await telegramApiClient.replyInTelegramChat('```\nServer Error\n```')
    return MESSAGE_RETRIEVAL_CONFIRMATION
  }
}
