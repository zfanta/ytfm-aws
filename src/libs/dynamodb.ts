import 'source-map-support/register'

import {
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DynamoDBClient, GetItemCommand,
  QueryCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { pubsubhubbub } from '@libs/sqs'
import { Token } from '@libs/types'

// TODO: region
const client = new DynamoDBClient({ region: 'us-east-1' })

interface Subscription {
  user: string
  channel: string
  enabled: boolean
}
async function getSubscriptions (user: string, ExclusiveStartKey?: any): Promise<Subscription[]> {
  const command = new QueryCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE_NAME,
    IndexName: 'user-idx',
    KeyConditionExpression: '#user = :user',
    ExpressionAttributeNames: { '#user': 'user' },
    ExpressionAttributeValues: { ':user': { S: user } },
    ExclusiveStartKey
  })

  const response = await client.send(command)
  const items = response.Items?.map(item => unmarshall(item) as Subscription) ?? []

  if (response.LastEvaluatedKey === undefined) return items

  return [...items, ...await getSubscriptions(user, response.LastEvaluatedKey)]
}

async function getSubscriptionsWithTitle (user: string): Promise<Array<{channel: string, enabled: boolean, title: string}>> {
  const subscriptions = await getSubscriptions(user)
  const channels = await getChannels(subscriptions.map(a => a.channel))

  const channelsObject: {[key: string]: Channel} = {}
  channels.forEach(channel => {
    channelsObject[channel.id] = channel
  })

  return subscriptions.map(subscription => ({
    channel: subscription.channel,
    enabled: subscription.enabled,
    title: channelsObject[subscription.channel].information.title
  }))
}

interface Channel {
  id: string
  expiresAt: number
  information: ChannelInformation
}
interface ChannelInformation {
  publishedAt: string
  title: string
  description: string
  thumbnails: Partial<Record<'default'|'medium'|'high', {
    'url': string
    'width': number
    'height': number
  }>>
}
async function getChannels (channelIds: string[]): Promise<Channel[]> {
  if (process.env.CHANNELS_TABLE_NAME === undefined) throw new Error('CHANNELS_TABLE_NAME is undefined')

  const result: Channel[] = []

  for (let i = 0; i < channelIds.length; i += 100) {
    // 100 limit
    const ids100 = channelIds.slice(i, i + 100)

    const command = new BatchGetItemCommand({
      RequestItems: {
        [process.env.CHANNELS_TABLE_NAME]: {
          ConsistentRead: false,
          Keys: ids100.map(id => ({ id: { S: id } }))
        }
      }
    })

    const items = (await client.send(command)).Responses?.[process.env.CHANNELS_TABLE_NAME]

    result.push(...(
      items?.map(item => unmarshall(item) as Channel) ?? []
    ))
  }

  return result
}

function informationEquals (o1: ChannelInformation, o2: ChannelInformation): boolean {
  if (o1.publishedAt !== o2.publishedAt) return false
  if (o1.description !== o2.description) return false
  if (o1.title !== o2.title) return false
  if (o1.thumbnails.default?.url !== o2.thumbnails.default?.url) return false
  if (o1.thumbnails.medium?.url !== o2.thumbnails.medium?.url) return false
  return o1.thumbnails.high?.url === o2.thumbnails.high?.url
}

async function updateChannels (channelsFromDB: Channel[], channelsFromYoutube: Channel[]): Promise<void> {
  const channelsFromDbObject: { [key: string]: Channel } = {}
  channelsFromDB.forEach(channel => { channelsFromDbObject[channel.id] = channel })

  const channelsFromYoutubeObject: { [key: string]: Channel } = {}
  channelsFromYoutube.forEach(channel => {
    channel.expiresAt = channelsFromDbObject[channel.id]?.expiresAt ?? 0
    channelsFromYoutubeObject[channel.id] = channel
  })

  // put
  const puts = channelsFromYoutube.filter(channelFromYoutube => {
    if (channelsFromDbObject[channelFromYoutube.id] === undefined) return true
    return !informationEquals(channelFromYoutube.information, channelsFromDbObject[channelFromYoutube.id].information)
  })

  // 25 limit
  const putRequests: any[] = []
  for (let i = 0; i < puts.length; i += 25) {
    const put25 = puts.slice(i, i + 25)
    putRequests.push(put25.map(put => {
      return {
        PutRequest: {
          Item: marshall(put)
        }
      }
    }))
  }

  const promises = putRequests.map(async putRequest => {
    if (process.env.CHANNELS_TABLE_NAME === undefined) throw new Error('CHANNELS_TABLE_NAME is undefined')

    const command = new BatchWriteItemCommand({
      RequestItems: {
        [process.env.CHANNELS_TABLE_NAME]: putRequest
      }
    })

    return await client.send(command)
  })

  await Promise.all(promises)
}

async function unsubscribeChannels (user: string, channelIds: string[]): Promise<void> {
  // 25 limit
  const deleteRequests: any[] = []
  for (let i = 0; i < channelIds.length; i++) {
    const channelIds25 = channelIds.slice(i, i + 25)
    deleteRequests.push(channelIds25.map(channelId => ({
      DeleteRequest: {
        Key: marshall({
          channel: channelId,
          user
        })
      }
    })))
  }

  const promises = deleteRequests.map(async deleteRequest => {
    if (process.env.SUBSCRIPTIONS_TABLE_NAME === undefined) throw new Error('CHANNELS_TABLE_NAME is undefined')

    const command = new BatchWriteItemCommand({
      RequestItems: {
        [process.env.SUBSCRIPTIONS_TABLE_NAME]: deleteRequest
      }
    })

    return await client.send(command)
  })

  await Promise.all(promises)
}

async function subscribeChannels (email: string, channelIds: string[]): Promise<void> {
  // Insert into subscriptions table

  // 25 limit
  const putRequests: any[] = []
  for (let i = 0; i < channelIds.length; i += 25) {
    const channelIds25 = channelIds.slice(i, i + 25)
    putRequests.push(channelIds25.map(channelId => {
      return {
        PutRequest: {
          Item: marshall({
            channel: channelId,
            user: email,
            enabled: true
          })
        }
      }
    }))
  }

  const promiseSubscriptions = putRequests.map(async putRequests => {
    if (process.env.SUBSCRIPTIONS_TABLE_NAME === undefined) throw new Error('SUBSCRIPTIONS_TABLE_NAME is undefined')

    const command = new BatchWriteItemCommand({
      RequestItems: {
        [process.env.SUBSCRIPTIONS_TABLE_NAME]: putRequests
      }
    })

    return await client.send(command)
  })

  await Promise.all(promiseSubscriptions)
}

async function syncChannels (email: string, channelsFromYoutube: Channel[]): Promise<Array<{id: string, title: string, enabled: boolean}>> {
  const channelIdsFromYoutube = channelsFromYoutube.map(channel => channel.id)
  const channelsFromDB = await getChannels(channelIdsFromYoutube)

  const subscriptionsFromDB = await getSubscriptions(email)
  const subscriptionChannelIdsFromDB = subscriptionsFromDB.map(subscriptionFromDB => subscriptionFromDB.channel)
  const channelIdsFromDB = channelsFromDB.filter(channelFromDB => subscriptionChannelIdsFromDB.includes(channelFromDB.id)).map(a => a.id)

  const intersection = subscriptionChannelIdsFromDB.filter(id => channelIdsFromYoutube.includes(id))

  // unsubscribe(channelsFromDB - channelsFromYoutube)
  const unsubscribes = channelIdsFromDB.filter(id => !intersection.includes(id))

  // subscribe(channelsFromYoutube - channelsFromDB)
  const subscribe = channelsFromYoutube.filter(channel => !intersection.includes(channel.id))

  await Promise.all([
    updateChannels(channelsFromDB, channelsFromYoutube),
    unsubscribeChannels(email, unsubscribes),
    subscribeChannels(email, subscribe.map(a => a.id))
  ])

  await pubsubhubbub('subscribe', subscribe.map(a => a.id))

  // return result
  const subscriptionsFromDBObject: {[key: string]: Subscription} = {}
  subscriptionsFromDB.forEach(subscriptionFromDB => {
    subscriptionsFromDBObject[subscriptionFromDB.channel] = subscriptionFromDB
  })

  return channelsFromYoutube.map(channel => ({
    id: channel.id,
    title: channel.information.title,
    enabled: subscriptionsFromDBObject[channel.id]?.enabled ?? true
  }))
}

async function updateChannelExpiry (id: string, expiresAt: number): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: process.env.CHANNELS_TABLE_NAME,
    Key: { id: { S: id } },
    UpdateExpression: 'SET #expiresAt = :expiresAt',
    ExpressionAttributeNames: { '#expiresAt': 'expiresAt' },
    ExpressionAttributeValues: { ':expiresAt': { N: `${expiresAt}` } }
  })

  await client.send(command)
}

async function updateUserSyncTime (email: string): Promise<Date> {
  const currentTime = new Date()
  const command = new UpdateItemCommand({
    TableName: process.env.USERS_TABLE_NAME,
    Key: marshall({ email }),
    UpdateExpression: 'SET #syncedAt = :syncedAt',
    ExpressionAttributeNames: { '#syncedAt': 'syncedAt' },
    ExpressionAttributeValues: { ':syncedAt': { N: `${currentTime.valueOf()}` } }
  })

  await client.send(command)

  return currentTime
}

async function getSubscription (channel: string, user: string): Promise<Subscription|undefined> {
  const command = new GetItemCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE_NAME,
    Key: marshall({ channel, user })
  })

  const response = await client.send(command)

  if (response.Item === undefined) return undefined

  return unmarshall(response.Item) as Subscription
}

async function updateSubscription (channel: string, user: string, enabled: boolean): Promise<boolean> {
  if (await getSubscription(channel, user) === undefined) return false

  const command = new UpdateItemCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE_NAME,
    Key: marshall({ channel, user }),
    UpdateExpression: 'SET #enabled = :enabled',
    ExpressionAttributeNames: { '#enabled': 'enabled' },
    ExpressionAttributeValues: marshall({ ':enabled': enabled })
  })

  await client.send(command)

  return true
}

async function updateGoogleToken (email: string, token: Token): Promise<Token> {
  const TableName = process.env.USERS_TABLE_NAME

  let newToken = token

  const getItemCommand = new GetItemCommand({
    TableName,
    Key: { email: { S: email } }
  })

  const result = await client.send(getItemCommand)
  if (result?.Item?.token?.S !== undefined) {
    const oldToken = JSON.parse(result.Item.token.S)
    newToken = Object.assign({}, oldToken, token)
  }

  const currentTime = new Date().valueOf()
  const expiresAt = currentTime + (token.expires_in * 1000)

  const updateItemCommand = new UpdateItemCommand({
    TableName,
    Key: marshall({ email }),
    UpdateExpression: 'SET #token = :token, #expiresAt = :expiresAt',
    ExpressionAttributeNames: { '#token': 'token', '#expiresAt': 'expiresAt' },
    ExpressionAttributeValues: marshall({ ':token': JSON.stringify(newToken), ':expiresAt': expiresAt })
  })

  await client.send(updateItemCommand)

  return newToken
}

export {
  getSubscriptions,
  updateSubscription,
  getSubscriptionsWithTitle,
  syncChannels,
  updateChannelExpiry,
  updateUserSyncTime,
  updateGoogleToken
}
