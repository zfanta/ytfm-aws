import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy } from '@libs/lambda'
import fetch from 'node-fetch'
import { URLSearchParams } from 'url'
import { DynamoDBClient, PutItemCommand, BatchWriteItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import * as qs from 'querystring'
import { SQSClient, SendMessageBatchCommand, SendMessageBatchRequestEntry, GetQueueUrlCommand } from '@aws-sdk/client-sqs'

// TODO: https://accounts.google.com/o/oauth2/auth?client_id=969455847018-o333jdbaqlsaag1oiv7jq74rcep2sg8g.apps.googleusercontent.com&redirect_uri=https%3A%2F%2Fwww.ytfm.app%2Foauth2&response_type=code&scope=email%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fyoutube.readonly&approval_prompt=auto&access_type=offline

const client = new DynamoDBClient({
  region: 'us-east-1'
  // endpoint: 'http://localhost:8000'
})

function response (statusCode: number, body: string): {statusCode: number, body: string} {
  return { statusCode, body }
}

async function setGoogleToken (email: string, token: Token): Promise<void> {
  const TableName = process.env.USERS_TABLE_NAME

  const currentTime = new Date().valueOf()
  const expiresAt = currentTime + (token.expires_in * 1000)

  const putItemCommand = new PutItemCommand(({
    TableName,
    Item: {
      email: { S: email },
      token: { S: JSON.stringify(token) },
      expiresAt: { N: `${expiresAt}` }
    }
  }))

  await client.send(putItemCommand)
}

async function getToken (code: string): Promise<Token> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH2_REDIRECT_URL } = process.env
  if (GOOGLE_CLIENT_ID === undefined) throw new Error('GOOGLE_CLIENT_ID is undefined')
  if (GOOGLE_CLIENT_SECRET === undefined) throw new Error('GOOGLE_CLIENT_SECRET is undefined')
  if (OAUTH2_REDIRECT_URL === undefined) throw new Error('OAUTH2_REDIRECT_URL is undefined')

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  const urlencoded = new URLSearchParams()
  urlencoded.append('code', code)
  urlencoded.append('client_id', GOOGLE_CLIENT_ID)
  urlencoded.append('client_secret', GOOGLE_CLIENT_SECRET)
  urlencoded.append('redirect_uri', OAUTH2_REDIRECT_URL)
  urlencoded.append('grant_type', 'authorization_code')

  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded
  }

  return await fetch('https://accounts.google.com/o/oauth2/token', requestOptions)
    .then(async response => await response.json())
}

async function getEmail (accessToken: string): Promise<string> {
  const query = qs.stringify({
    access_token: accessToken
  })

  const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?${query}`).then(async response => await response.json())
  return response.email
}

// TODO: use etag
async function getSubscriptions (accessToken: string, pageToken?: string): Promise<string[]> {
  const url = 'https://www.googleapis.com/youtube/v3/subscriptions'
  const query = qs.stringify({
    access_token: accessToken,
    part: ['snippet'],
    mine: true,
    maxResults: 50,
    order: 'alphabetical',
    pageToken
  })

  const response: SubscriptionListResponse = await fetch(`${url}?${query}`).then(async response => await response.json())

  const channels = response.items.map(item => item.snippet.resourceId.channelId)

  if (response.nextPageToken === undefined) {
    return channels
  }

  return [...channels, ...(await getSubscriptions(accessToken, response.nextPageToken))]
}

async function setSubscription (user: string, channels: string[]): Promise<void> {
  if (process.env.SUBSCRIPTIONS_TABLE_NAME === undefined) throw new Error('SUBSCRIPTIONS_TABLE_NAME is undefined')
  if (process.env.USERS_TABLE_NAME === undefined) throw new Error('USERS_TABLE_NAME is undefined')

  let TableName = process.env.SUBSCRIPTIONS_TABLE_NAME

  // 25 limit
  const requests: PutRequests = []
  for (let i = 0; i < channels.length; i += 25) {
    requests.push(channels.slice(i, i + 25).map(channel => ({
      PutRequest: {
        Item: {
          channel: { S: channel },
          user: { S: user },
          enabled: { BOOL: true }
        }
      }
    })))
  }

  await Promise.all(requests.map(async request => {
    const command = new BatchWriteItemCommand({
      RequestItems: {
        [TableName]: request
      }
    })

    await client.send(command)
  }))

  // Set syncedAt
  TableName = process.env.USERS_TABLE_NAME

  const currentTime = new Date().valueOf()

  const updateItemCommand = new UpdateItemCommand({
    TableName,
    Key: {
      email: { S: user }
    },
    UpdateExpression: 'set syncedAt = :value',
    ExpressionAttributeValues: {
      ':value': { N: `${currentTime}` }
    }
  })

  await client.send(updateItemCommand)
}

async function sendToSQS (channelIds: string[]): Promise<void> {
  console.log('Send to SQS =>')

  if (process.env.PUBSUBHUBBUB_QUEUE_NAME === undefined) throw new Error('PUBSUBHUBBUB_QUEUE_NAME is undefined')

  console.log('Number of channels:', channelIds.length)

  // TODO: region hard coding
  const sqs = new SQSClient({ region: 'us-east-1' })

  // limit 10
  const entries: SendMessageBatchRequestEntry[][] = []
  const currentTime = new Date().toISOString().replace(/:/g, '__').replace(/\./g, '_')
  for (let i = 0; i < channelIds.length; i += 10) {
    entries.push(channelIds.slice(i, i + 10).map((channelId, index) => ({
      Id: `${currentTime}-${i + index}`,
      MessageBody: JSON.stringify({ channelId, mode: 'subscribe' }),
      MessageAttributes: {
        channelId: {
          StringValue: channelId,
          DataType: 'String'
        },
        mode: {
          StringValue: 'subscribe',
          DataType: 'String'
        }
      }
    })))
  }

  // Get queue url
  const command = new GetQueueUrlCommand({
    QueueName: process.env.PUBSUBHUBBUB_QUEUE_NAME
  })
  const { QueueUrl } = await sqs.send(command)
  if (QueueUrl === undefined) throw new Error('Cannot find queue url')

  await Promise.all(entries.map(async entry => {
    const command = new SendMessageBatchCommand({
      QueueUrl,
      Entries: entry
    })
    const data = await sqs.send(command)
    if (data.Failed !== undefined) {
      console.log('Failed:', data.Failed)
    }
  }))
  console.log('<= Send to SQS')
}

const get: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const code = event.queryStringParameters?.code

  if (code === undefined) return response(400, 'code is undefined')

  let token
  try {
    token = await getToken(code)
  } catch (e) {
    return response(503, e.message)
  }

  if (token.error !== undefined) {
    return {
      statusCode: 403,
      body: JSON.stringify(token)
    }
  }

  const email = await getEmail(token.access_token)

  await setGoogleToken(email, token)

  const channels = await getSubscriptions(token.access_token)
  await setSubscription(email, channels)
  try {
    await sendToSQS(channels)
  } catch (e) {
    return {
      statusCode: 503,
      body: e.message
    }
  }

  return {
    statusCode: 303,
    headers: {
      Location: '/'
    },
    body: ''
  }
}

export const main = middyfy(get)

interface Token {
  'access_token': string
  'token_type': 'Bearer'
  'expires_in': number
  'refresh_token'?: string
  'scope': string
  'error'?: string
  'error_description'?: string
}

interface SubscriptionListResponse {
  'kind': 'youtube#subscriptionListResponse'
  'etag': string
  'nextPageToken': string
  'prevPageToken': string
  'pageInfo': {
    'totalResults': number
    'resultsPerPage': number
  }
  'items': SubscriptionResponse[]
}

interface SubscriptionResponse {
  'kind': 'youtube#subscription'
  'etag': string
  'id': string
  'snippet': {
    'publishedAt': string
    'channelTitle': string
    'title': string
    'description': string
    'resourceId': {
      'kind': string
      'channelId': string
    }
    'channelId': string
    'thumbnails': Partial<Record<'default'|'medium'|'high', {
      'url': string
      'width': number
      'height': number
    }>>
  }
  'contentDetails': {
    'totalItemCount': number
    'newItemCount': number
    'activityType': string
  }
  'subscriberSnippet': {
    'title': string
    'description': string
    'channelId': string
    'thumbnails': Partial<Record<'default'|'medium'|'high', {
      'url': string
      'width': number
      'height': number
    }>>
  }
}

type PutRequests = Array<Array<{
  PutRequest: {
    Item: {
      channel: { S: string }
      user: { S: string }
      enabled: { BOOL: true }
    }
  }
}>>
