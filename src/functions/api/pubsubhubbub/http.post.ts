import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy } from '@libs/lambda'
import xml2js from 'xml2js'
import { DynamoDBClient, PutItemCommand, GetItemCommand, QueryCommand } from '@aws-sdk/client-dynamodb'
import { pushNotificationEmail } from '@libs/sqs'
import { VideoFromGoogleApis, VideoResponse } from '@libs/types'
import qs from 'querystring'
import fetch from 'node-fetch'

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

  // Ignore if it is not publishing
  if (new Date(video.updated).valueOf() - new Date(video.published).valueOf() < 1000 * 60 * 60) {
    // Ignore if mail is sent
    if (!(await videoExists(video.id))) {
      console.log('new video:', video.id)

      await addVideo(video.id)

      const videoFromGoogleApi = await getVideoInformation(video.id, video.channelId)

      const subscribers = await getSubscribers(video.channelId)

      await pushNotificationEmail(videoFromGoogleApi, subscribers)
    }
  }

  console.log('<= Pubsubhubbub callback[post]')
  return response(200, '')
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

async function getVideoInformation (videoId: string, channelId: string): Promise<VideoFromGoogleApis> {
  if (process.env.GOOGLE_API_KEY === undefined) throw new Error('GOOGLE_API_KEY is undefined')

  const query = qs.stringify({
    id: videoId,
    part: 'id,snippet,contentDetails,player',
    key: process.env.GOOGLE_API_KEY
  })

  const response: VideoResponse = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?${query}`)).json()

  if (response.items.length === 0) throw new Error('Invalid video')
  if (response.items[0].snippet.channelId !== channelId) throw new Error('Invalid video')

  return response.items[0]
}

export const handler = middyfy(post)
