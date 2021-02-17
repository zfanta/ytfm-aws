import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy } from '@libs/lambda'
import xml2js from 'xml2js'
import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { pushNotificationEmail } from '@libs/sqs'

const client = new DynamoDBClient({
  // TODO: region name
  region: 'us-east-1'
})

function response (statusCode: number, body: string): {statusCode: number, body: string} {
  return { statusCode, body }
}

const post: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  console.log('Pubsubhubbub callback[post] =>')

  const entry = (await xml2js.parseStringPromise(event.body)).feed.entry[0]

  const video = {
    id: entry['yt:videoId'][0],
    title: entry.title[0],
    channelId: entry['yt:channelId'][0],
    channelName: entry.author[0].name[0],
    published: entry.published[0],
    updated: entry.updated[0]
  }

  // Ignore if mail is sent
  if (await isNewVideo(video)) {
    console.log('new video:', video)
    await addVideo(video.id)

    const subscribers = await getSubscribers(video.channelId)

    await pushNotificationEmail(video, subscribers)
  }

  console.log('<= Pubsubhubbub callback[post]')
  return response(200, '')
}

async function isNewVideo (video): Promise<boolean> {
  if (!(await videoExists(video.id))) {
    console.log('new video:', video)
    // Ignore if it is not publishing, but updating
    if (new Date(video.updated).valueOf() - new Date(video.published).valueOf() < 1000 * 60 * 60) {
      return true
    }
  }
  return false
}

async function videoExists (videoId: string): Promise<boolean> {
  const command = new GetItemCommand({
    TableName: process.env.VIDEOS_TABLE_NAME,
    Key: {
      id: { S: videoId }
    }
  })

  const result = await client.send(command)

  return result.Item !== undefined
}

async function addVideo (videoId: string): Promise<void> {
  const command = new PutItemCommand({
    TableName: process.env.VIDEOS_TABLE_NAME,
    Item: {
      id: { S: videoId }
    }
  })

  await client.send(command)
}

async function getSubscribers (channelId: string): Promise<string[]> {
  const command = new QueryCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE_NAME,
    KeyConditionExpression: 'channel = :channelId',
    ExpressionAttributeValues: { ':channelId': { S: channelId } }
  })

  const result = await client.send(command)
  if (result.LastEvaluatedKey !== undefined) {
    // TODO:
  }

  if (result.Items === undefined) {
    return []
  }

  return result.Items.map(item => item.user.S as string)
}

export const handler = middyfy(post)
