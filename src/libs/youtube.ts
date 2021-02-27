// TODO: use etag
import qs from 'querystring'
import fetch from 'node-fetch'
import { BatchWriteItemCommand, DynamoDBClient, UpdateItemCommand } from '@aws-sdk/client-dynamodb'

const client = new DynamoDBClient({
  // TODO: region
  region: 'us-east-1'
  // endpoint: 'http://localhost:8000'
})

async function getSubscriptions (accessToken: string, pageToken?: string): Promise<SubscriptionResponse[]> {
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

  if (response.nextPageToken === undefined) {
    return response.items
  }

  return [...response.items, ...(await getSubscriptions(accessToken, response.nextPageToken))]
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

export {
  getSubscriptions,
  setSubscription
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

export type {
  SubscriptionResponse
}
