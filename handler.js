'use strict'

/* eslint-disable eqeqeq */
// eslint-disable-next-line import/no-extraneous-dependencies,import/no-unresolved
const AWS = require('aws-sdk')
const lodash = require('lodash')

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
      headers: CORS_HEADERS,
      body: JSON.stringify({ status: 'Success' })
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
  console.log(`telegram-resp=${telegramAPIReply}`)
}

exports.TelegramMessageHandler = async function (event, context) {
  // SECURITY_TOKEN ensures that only calls from the Telegram Webhook are allowed
  const token = lodash.get(event, 'pathParameters.token')
  if (process.env.SECURITY_TOKEN != token) {
    console.error(`Request declined. token=${token}`)
    return MESSAGE_RETRIEVAL_CONFIRMATION
  }

  const dynamoDBItem = await getAccessTokenForChatId(process.env.TELEGRAM_CHAT_ID)
  const accessToken = lodash.get(dynamoDBItem, 'Item.accessToken.S')
  const fitBitApiClient = new FitBitApiClient(accessToken)

  const message = lodash.get(JSON.parse(event.body), 'message')
  const telegramMessage = TelegramMessage.getInstance(message)
  const telegramApiClient = TelegramApiClient.getInstance(process.env.TELEGRAM_API_TOKEN, telegramMessage.getChatId())

  console.log(`accessToken=${accessToken}`)
  console.log(`chatId=${telegramMessage.getChatId()}`)
  console.log(`message=${telegramMessage.getLowerCaseTextMessage()}`)

  const queryParams = TelegramApiClient.getQueryParamsForFoodLog(telegramMessage.getLowerCaseTextMessage())

  if (queryParams) {
    console.log('command=log-food')
    const logResult = await fitBitApiClient.logFood(queryParams)
    const logs = await fitBitApiClient.getFoodLog()
    console.log(logResult)
    console.log(JSON.stringify(logs.body))

    const total = lodash.get(logs, 'body.summary.calories', null)
    const budget = lodash.get(logs, 'body.goals.calories', '∞')

    const reply = `
            ${'Calories today:'.padEnd(20, ' ')} ${total.toString().padStart(4, ' ')}\n${'Remaining budget:'.padEnd(20, ' ')} ${(budget - total).toString().padStart(4, ' ')}
            `
    const telegramAPIReply = await telegramApiClient.replyInTelegramChat(reply)
    console.log(`reply=${telegramAPIReply}`)
  } else {
    if (telegramMessage.getLowerCaseTextMessage() === 'init') {
      console.log('command=init-flow')
      const url = makeOAuthURLForInitMessage(telegramMessage)
      const telegramAPIReply = await telegramApiClient.replyInTelegramChat(url)
      console.log(`reply=${telegramAPIReply}`)
      return MESSAGE_RETRIEVAL_CONFIRMATION
    }

    if (telegramMessage.getLowerCaseTextMessage() === 'commands') {
      console.log('command=get-commands')
      const telegramAPIReply = await telegramApiClient.replyInTelegramChat(ResponseProcessor.getPossibleCommands())
      console.log(`reply=${telegramAPIReply}`)
      return MESSAGE_RETRIEVAL_CONFIRMATION
    }

    if (telegramMessage.getLowerCaseTextMessage() === 'log') {
      console.log('command=get-log')
      const foodLog = await fitBitApiClient.getFoodLog()
      const logsBody = JSON.stringify(foodLog.body)
      console.log(logsBody)
      const telegramAPIReply = await telegramApiClient.replyInTelegramChat(ResponseProcessor.convertFoodLogJSONToUserFriendlyText(foodLog.body))
      console.log(`reply=${telegramAPIReply}`)
      return MESSAGE_RETRIEVAL_CONFIRMATION
    }

    console.log('command=not-understood')
    const telegramAPIReply = await telegramApiClient.replyInTelegramChat('Command not understood. Nothing has been logged')
    console.log(`reply=${telegramAPIReply}`)
  }

  return MESSAGE_RETRIEVAL_CONFIRMATION
}
