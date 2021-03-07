import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import xml2js from 'xml2js'
import { VideoFromGoogleApis, VideoResponse } from '@libs/types'
import qs from 'querystring'
import fetch from 'node-fetch'
import { getChannelSubscribers, getVideo, putVideo } from '@libs/dynamodb'
import { sendNotificationEmail } from '@libs/email'

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
    if (await getVideo(video.id) === undefined) {
      console.log('new video:', video.id)

      await putVideo(video.id)

      const videoFromGoogleApi = await getVideoInformation(video.id, video.channelId)

      const subscribers = await getChannelSubscribers(video.channelId)

      const notifications = subscribers.map(subscriber => ({
        video: videoFromGoogleApi,
        subscriber
      }))
      await sendNotificationEmail(notifications)
    }
  }

  console.log('<= Pubsubhubbub callback[post]')
  return response(200, '')
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
