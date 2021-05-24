import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import xml2js from 'xml2js'
import { VideoFromGoogleApis, VideoResponse } from '@libs/types'
import qs from 'querystring'
import fetch from 'node-fetch'
import { getChannelSubscribers, getUsers, getVideo, putVideo, getChannels } from '@libs/dynamodb'
import { sendNotificationEmail } from '@libs/email'
import createLogger from '@libs/createLogger'
import dayjs from 'dayjs'

const logger = createLogger('/api/pubsubhubbub/http.post.ts')

const post: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  logger.debug('=>')
  if (typeof event.body === 'string') {
    logger.info(`Received\n${event.body}`)
  }

  const { feed } = await xml2js.parseStringPromise(event.body)
  if (feed['at:deleted-entry'] !== undefined) return response(200)

  const entry = feed.entry[0]

  const video = {
    id: entry['yt:videoId'][0],
    channelId: entry['yt:channelId'][0]
  }

  // Ignore if video is updated
  if (dayjs(entry.published[0]).add(1, 'day').valueOf() < dayjs().valueOf()) {
    return response(200)
  }

  // Ignore if mail is sent
  if (await getVideo(video.id) === undefined) {
    logger.info('new video:', video.id)

    const videoFromGoogleApi = await getVideoInformation(video.id, video.channelId)

    // Double check if video is updated
    if (dayjs(videoFromGoogleApi.snippet.publishedAt).add(1, 'day').valueOf() < dayjs().valueOf()) {
      return response(200)
    }

    await putVideo(videoFromGoogleApi)

    const subscriberEmails = await getChannelSubscribers(video.channelId)
    let users = (await getUsers(subscriberEmails)).filter(user => user.notification)

    // filter region
    const allowed = videoFromGoogleApi.contentDetails.regionRestriction?.allowed
    const blocked = videoFromGoogleApi.contentDetails.regionRestriction?.blocked
    if (blocked !== undefined) {
      users = users.filter(user => user.region === undefined || !blocked.includes(user.region))
    }
    if (allowed !== undefined) {
      users = users.filter(user => user.region === undefined || allowed.includes(user.region))
    }

    const channel = (await getChannels([video.channelId]))[0]
    const userSet = new Set(users.map(user => user.email))

    const notifications = subscriberEmails.filter(subscriber => userSet.has(subscriber) !== undefined).map(subscriber => ({
      video: videoFromGoogleApi,
      subscriber
    }))
    logger.info(`Send notification\n${JSON.stringify(videoFromGoogleApi)}`)
    await sendNotificationEmail(
      notifications,
      channel.information.thumbnails.default?.url ?? 'https://yt3.ggpht.com/ytc/AAUvwnjkjfwolT7enHlIsv2kSn17Ei6Vte8cKIuvVIUtug=s88-c-k-c0x00ffffff-no-rj',
      event.body
    )
  }

  logger.debug('<=')
  return response(200, '')
}

async function getVideoInformation (videoId: string, channelId: string): Promise<VideoFromGoogleApis> {
  if (process.env.GOOGLE_API_KEY === undefined) throw new Error('GOOGLE_API_KEY is undefined')

  const query = qs.stringify({
    id: videoId,
    part: 'id,snippet,contentDetails,player,status,liveStreamingDetails',
    key: process.env.GOOGLE_API_KEY
  })

  const response: VideoResponse = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?${query}`)).json()

  if (response.items.length === 0) throw new Error('Invalid video')
  if (response.items[0].snippet.channelId !== channelId) throw new Error('Invalid video')

  return response.items[0]
}

export const handler = middyfy(post)
