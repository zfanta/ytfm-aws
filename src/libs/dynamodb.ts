import 'source-map-support/register'

import type { DeleteRequest } from '@aws-sdk/client-dynamodb'
// TODO: replace ScanCommand -> QueryCommand
import {
  BatchGetItemCommand,
  BatchWriteItemCommand,
  DeleteItemCommand,
  DynamoDBClient,
  GetItemCommand,
  PutItemCommand,
  QueryCommand,
  ScanCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'
import { Token } from '@libs/types'
import dayjs from 'dayjs'
import { sendToPubsubhubbub } from '@libs/youtube'
import sodium from 'libsodium-wrappers'

// TODO: region
const client = new DynamoDBClient({ region: 'us-east-1' })

interface Subscription {
  user: string
  channel: string
  notification: boolean
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

async function getSubscriptionsWithTitle (user: string): Promise<Array<{channel: string, notification: boolean, title: string, thumbnail: string|undefined}>> {
  const subscriptions = await getSubscriptions(user)
  const channels = await getChannels(subscriptions.map(a => a.channel))

  const channelsObject: {[key: string]: Channel} = {}
  channels.forEach(channel => {
    channelsObject[channel.id] = channel
  })

  return subscriptions.map(subscription => ({
    channel: subscription.channel,
    notification: subscription.notification,
    title: channelsObject[subscription.channel].information.title,
    thumbnail: channelsObject[subscription.channel].information.thumbnails.default?.url
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
            notification: true
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

async function syncChannels (email: string, channelsFromYoutube: Channel[]): Promise<Array<{id: string, title: string, notification: boolean, thumbnail: string|undefined}>> {
  const channelIdsFromYoutube = channelsFromYoutube.map(channel => channel.id)
  const channelsFromDB = await getChannels(channelIdsFromYoutube)

  const subscriptionsFromDB = await getSubscriptions(email)
  const subscriptionChannelIdsFromDB = subscriptionsFromDB.map(subscriptionFromDB => subscriptionFromDB.channel)

  const intersection = subscriptionChannelIdsFromDB.filter(id => channelIdsFromYoutube.includes(id))

  // unsubscribe(subscriptionsFromDB - channelsFromYoutube)
  const unsubscribes = subscriptionChannelIdsFromDB.filter(id => !intersection.includes(id))

  // subscribe(channelsFromYoutube - subscriptionsFromDB)
  const subscribe = channelsFromYoutube.filter(channel => !intersection.includes(channel.id))

  await Promise.all([
    updateChannels(channelsFromDB, channelsFromYoutube),
    unsubscribeChannels(email, unsubscribes),
    subscribeChannels(email, subscribe.map(a => a.id))
  ])

  await sendToPubsubhubbub(subscribe.map(a => a.id), 'subscribe')

  // return result
  const subscriptionsFromDBObject: {[key: string]: Subscription} = {}
  subscriptionsFromDB.forEach(subscriptionFromDB => {
    subscriptionsFromDBObject[subscriptionFromDB.channel] = subscriptionFromDB
  })

  return channelsFromYoutube.map(channel => ({
    id: channel.id,
    title: channel.information.title,
    notification: subscriptionsFromDBObject[channel.id]?.notification ?? true,
    thumbnail: channel.information.thumbnails.default?.url
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

  await Promise.all([
    client.send(command),
    updateUserSubscriptionUpdatedTime(email, currentTime)
  ])

  return currentTime
}

async function updateUserSubscriptionUpdatedTime (email: string, currentTime: Date): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: process.env.USERS_TABLE_NAME,
    Key: marshall({ email }),
    UpdateExpression: 'SET #updatedAt = :updatedAt',
    ExpressionAttributeNames: { '#updatedAt': 'updatedAt' },
    ExpressionAttributeValues: { ':updatedAt': { N: `${currentTime.valueOf()}` } }
  })

  await client.send(command)
}

async function updateUserNotification (email: string, notification: boolean): Promise<Date> {
  const currentTime = new Date()
  const command = new UpdateItemCommand({
    TableName: process.env.USERS_TABLE_NAME,
    Key: marshall({ email }),
    UpdateExpression: 'SET #notification = :notification',
    ExpressionAttributeNames: { '#notification': 'notification' },
    ExpressionAttributeValues: { ':notification': { BOOL: notification } }
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

async function updateSubscription (channel: string, user: string, notification: boolean, currentTime: Date): Promise<boolean> {
  if (await getSubscription(channel, user) === undefined) return false

  const command = new UpdateItemCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE_NAME,
    Key: marshall({ channel, user }),
    UpdateExpression: 'SET #notification = :notification',
    ExpressionAttributeNames: { '#notification': 'notification' },
    ExpressionAttributeValues: marshall({ ':notification': notification })
  })

  await Promise.all([
    client.send(command),
    updateUserSubscriptionUpdatedTime(user, currentTime)
  ])

  return true
}

async function updateGoogleTokenAndPhotos (email: string, oldToken: Token|undefined, newToken: Token, photos?: string[]): Promise<Token> {
  const TableName = process.env.USERS_TABLE_NAME

  let tokenToInsert = newToken

  if (oldToken === undefined) {
    const user = await getUser(email)
    oldToken = user?.token ?? newToken
  }

  tokenToInsert = Object.assign({}, oldToken, newToken)

  const currentTime = new Date().valueOf()
  const expiresAt = currentTime + (newToken.expires_in * 1000)

  const updateItemCommand = new UpdateItemCommand({
    TableName,
    Key: marshall({ email }),
    UpdateExpression: photos === undefined
      ? 'SET #token = :token, #expiresAt = :expiresAt, #notification = :notification'
      : 'SET #token = :token, #expiresAt = :expiresAt, #photos = :photos, #notification = :notification',
    ExpressionAttributeNames: photos === undefined
      ? { '#token': 'token', '#expiresAt': 'expiresAt', '#notification': 'notification' }
      : { '#token': 'token', '#expiresAt': 'expiresAt', '#photos': 'photos', '#notification': 'notification' },
    ExpressionAttributeValues: marshall(photos === undefined
      ? { ':token': tokenToInsert, ':expiresAt': expiresAt, ':notification': true }
      : { ':token': tokenToInsert, ':expiresAt': expiresAt, ':photos': photos, ':notification': true }
    )
  })

  await client.send(updateItemCommand)

  return tokenToInsert
}

interface Session {
  id: string
  atime: number
  expiresAt: number
  user: string
  data: string
}
async function getSession (SID: string): Promise<Session|undefined> {
  const command = new GetItemCommand({
    TableName: process.env.SESSIONS_TABLE_NAME,
    ConsistentRead: true,
    Key: {
      id: { S: SID }
    }
  })

  const result = await client.send(command)
  if (result.Item === undefined) return undefined
  return unmarshall(result.Item) as Session
}

async function getSessionsByUser (user: string, ExclusiveStartKey?: any): Promise<Session[]> {
  const command = new QueryCommand({
    TableName: process.env.SESSIONS_TABLE_NAME,
    KeyConditionExpression: '#kn0 = :kv0',
    IndexName: 'user-idx',
    ExpressionAttributeNames: { '#kn0': 'user' },
    ExpressionAttributeValues: { ':kv0': { S: user } },
    ExclusiveStartKey
  })

  const result = await client.send(command)
  const sessions = result.Items?.map(item => unmarshall(item)) as Session[] ?? []

  if (result.LastEvaluatedKey === undefined) return sessions

  return [...sessions, ...await getSessionsByUser(user, result.LastEvaluatedKey)]
}

export interface User {
  email: string
  notification: boolean
  expiresAt: number
  syncedAt?: number
  updatedAt?: number
  token: Token
  photos: string[]
}
async function getUser (email: string): Promise<User| undefined> {
  const command = new GetItemCommand({
    TableName: process.env.USERS_TABLE_NAME,
    Key: marshall({ email })
  })

  const response = await client.send(command)
  if (response.Item === undefined) return undefined

  const user = unmarshall(response.Item) as User
  if (user.email === undefined) return undefined
  if (user.expiresAt === undefined) return undefined
  if (user.token === undefined) return undefined

  return user
}

async function getUsers (emails: string[]): Promise<User[]> {
  if (process.env.USERS_TABLE_NAME === undefined) throw new Error('CHANNELS_TABLE_NAME is undefined')

  const result: User[] = []

  for (let i = 0; i < emails.length; i += 100) {
    // 100 limit
    const emails100 = emails.slice(i, i + 100)

    const command = new BatchGetItemCommand({
      RequestItems: {
        [process.env.USERS_TABLE_NAME]: {
          ConsistentRead: false,
          Keys: emails100.map(email => ({ email: { S: email } }))
        }
      }
    })

    const items = (await client.send(command)).Responses?.[process.env.USERS_TABLE_NAME]

    result.push(...(
      items?.map(item => unmarshall(item) as User) ?? []
    ))
  }

  return result
}

async function deleteUser (email: string): Promise<void> {
  const command = new DeleteItemCommand({
    TableName: process.env.USERS_TABLE_NAME,
    Key: { email: { S: email } }
  })

  await client.send(command)
}

async function updateSessionUser (SID: string, user: string): Promise<void> {
  const command = new UpdateItemCommand({
    TableName: process.env.SESSIONS_TABLE_NAME,
    Key: { id: { S: SID } },
    UpdateExpression: 'SET #user = :user',
    ExpressionAttributeNames: { '#user': 'user' },
    ExpressionAttributeValues: { ':user': { S: user } }
  })

  await client.send(command)
}

async function deleteSession (SID: string): Promise<void> {
  const deleteItemCommand = new DeleteItemCommand({
    TableName: process.env.SESSIONS_TABLE_NAME,
    Key: {
      id: { S: SID }
    }
  })

  await client.send(deleteItemCommand)
}

async function putSession (SID: string, user: string, data?: string): Promise<void> {
  const Item = marshall({
    id: SID,
    user,
    atime: new Date().valueOf(),
    expiresAt: dayjs().add(1, 'year').toDate().valueOf()
  })
  if (data !== undefined) {
    Object.assign(Item, {
      data: { S: data }
    })
  }

  const putItemCommand = new PutItemCommand(({
    TableName: process.env.SESSIONS_TABLE_NAME,
    Item
  }))

  await client.send(putItemCommand)
}

async function getExpiredSessions (ExclusiveStartKey?: any): Promise<string[]> {
  const command = new ScanCommand({
    TableName: process.env.SESSIONS_TABLE_NAME,
    IndexName: 'expiresAt-idx',
    FilterExpression: '#expiresAt <= :expiresAt',
    ExpressionAttributeNames: { '#expiresAt': 'expiresAt' },
    ExpressionAttributeValues: { ':expiresAt': { N: `${new Date().valueOf()}` } },
    ExclusiveStartKey
  })

  const result = await client.send(command)
  const expired = result.Items?.map(item => item.id.S as string) ?? []

  if (result.LastEvaluatedKey === undefined) return expired

  return [...expired, ...await getExpiredSessions(result.LastEvaluatedKey)]
}

// 1 month
async function getOldEmptySessions (ExclusiveStartKey?: any): Promise<string[]> {
  const command = new QueryCommand({
    TableName: process.env.SESSIONS_TABLE_NAME,
    IndexName: 'empty-idx',
    KeyConditionExpression: '#user = :empty AND #atime < :atime',
    ExpressionAttributeNames: {
      '#user': 'user',
      '#atime': 'atime'
    },
    ExpressionAttributeValues: {
      ':empty': { S: 'empty' },
      ':atime': { N: `${dayjs().subtract(1, 'month').toDate().valueOf()}` }
    },
    ExclusiveStartKey
  })

  const result = await client.send(command)
  const ids = result.Items?.map(item => item.id.S as string) ?? []

  if (result.LastEvaluatedKey === undefined) return ids

  return [...ids, ...await getOldEmptySessions(result.LastEvaluatedKey)]
}

async function deleteSessions (ids: string[]): Promise<void> {
  const TableName = process.env.SESSIONS_TABLE_NAME
  if (TableName === undefined) throw new Error('SESSIONS_TABLE_NAME is undefined')

  // 25 limit
  const requests: Array<Array<{DeleteRequest: DeleteRequest}>> = []
  for (let i = 0; i < ids.length; i += 25) {
    requests.push(ids.slice(i, i + 25).map(id => ({
      DeleteRequest: {
        Key: { id: { S: id } }
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
}

interface Video {
  id: string
}
async function getVideo (videoId: string): Promise<Video|undefined> {
  const command = new GetItemCommand({
    TableName: process.env.VIDEOS_TABLE_NAME,
    Key: { id: { S: videoId } }
  })

  const response = await client.send(command)

  if (response.Item === undefined) return undefined

  return unmarshall(response.Item) as Video
}

async function putVideo (videoId: string): Promise<void> {
  const command = new PutItemCommand({
    TableName: process.env.VIDEOS_TABLE_NAME,
    Item: { id: { S: videoId } }
  })

  await client.send(command)
}

async function getChannelSubscribers (channelId: string, ExclusiveStartKey?: any): Promise<string[]> {
  const command = new QueryCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE_NAME,
    KeyConditionExpression: 'channel = :channelId',
    ExpressionAttributeValues: { ':channelId': { S: channelId } },
    ExclusiveStartKey
  })

  const response = await client.send(command)

  if (response.Items === undefined) {
    return []
  }

  const items = response.Items.map(item => item.user.S as string)

  if (response.LastEvaluatedKey === undefined) return items

  return [...items, ...await getChannelSubscribers(channelId, response.LastEvaluatedKey)]
}

async function getImpendingPubsubhubbub (impendingTime: number|undefined, ExclusiveStartKey: any|undefined): Promise<string[]> {
  if (process.env.CHANNELS_TABLE_NAME === undefined) throw new Error('CHANNELS_TABLE_NAME is undefined')

  const currentTime = new Date().valueOf()
  if (impendingTime === undefined) {
    impendingTime = currentTime + (1000 * 60 * 60 * 24) // 1 day
  }
  // const impendingTime = 1714864336894

  console.log(`Get before ${new Date(impendingTime).toISOString()}`)

  const command = new ScanCommand({
    TableName: process.env.CHANNELS_TABLE_NAME,
    IndexName: 'expiresAt-idx',
    FilterExpression: '#expiresAt < :expiresAt',
    ExpressionAttributeNames: { '#expiresAt': 'expiresAt' },
    ExpressionAttributeValues: { ':expiresAt': { N: `${impendingTime}` } },
    ExclusiveStartKey
  })

  const result = await client.send(command)
  const channelIds = result.Items?.map(item => item.id.S as string) ?? []

  if (result.LastEvaluatedKey === undefined) return channelIds

  return [...channelIds, ...await getImpendingPubsubhubbub(impendingTime, result.LastEvaluatedKey)]
}

async function deleteAccount (user: string): Promise<void> {
  const [sessions, subscriptions] = await Promise.all([
    await getSessionsByUser(user),
    await getSubscriptions(user)
  ])

  await Promise.all([
    unsubscribeChannels(user, subscriptions.map(subscription => subscription.channel)),
    deleteSessions(sessions.map(session => session.id)),
    deleteUser(user)
  ])
}

async function putNewKey (type: 'unsubscribe'): Promise<void> {
  await sodium.ready

  const key = sodium.crypto_secretbox_keygen('uint8array')
  const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES, 'uint8array')

  const Item = marshall({
    type,
    createdAt: new Date().valueOf(),
    key,
    nonce
  })

  const putItemCommand = new PutItemCommand(({
    TableName: process.env.KEYS_TABLE_NAME,
    Item
  }))

  await client.send(putItemCommand)
}

interface UnsubscribeKeys {
  keys: Array<{
    type: string
    createdAt: number
    key: Uint8Array
    nonce: Uint8Array
  }>
  ExclusiveStartKey?: any
}
async function getKeys (type: 'unsubscribe', ExclusiveStartKey?: any): Promise<UnsubscribeKeys> {
  const command = new QueryCommand({
    TableName: process.env.KEYS_TABLE_NAME,
    KeyConditionExpression: '#type = :type',
    ExpressionAttributeNames: { '#type': 'type' },
    ExpressionAttributeValues: { ':type': { S: type } },
    ConsistentRead: false,
    ScanIndexForward: false,
    ExclusiveStartKey
  })

  const response = await client.send(command)
  const items = response.Items ?? []

  if (items.length === 0) {
    await putNewKey(type)
    return await getKeys(type, ExclusiveStartKey)
  }

  return {
    keys: items.map(item => unmarshall(item) as {
      type: string
      createdAt: number
      key: Uint8Array
      nonce: Uint8Array
    }),
    ExclusiveStartKey: response.LastEvaluatedKey
  }
}

putNewKey('unsubscribe').catch(console.error)

export {
  getSubscriptions,
  updateSubscription,
  getSubscriptionsWithTitle,
  syncChannels,
  updateChannelExpiry,
  updateUserSyncTime,
  updateUserNotification,
  updateGoogleTokenAndPhotos,
  getUser,
  getUsers,

  getSession,
  updateSessionUser,
  deleteSession,
  putSession,
  getExpiredSessions,
  getOldEmptySessions,
  deleteSessions,

  getVideo,
  putVideo,
  getChannelSubscribers,

  getImpendingPubsubhubbub,

  deleteAccount,

  putNewKey,
  getKeys
}
