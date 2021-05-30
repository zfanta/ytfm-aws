import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import xml2js from 'xml2js'
import { getChannelSubscribers, getUsers, getVideo, putVideo, getChannels } from '@libs/dynamodb'
import { sendNotificationEmail } from '@libs/email'
import createLogger from '@libs/createLogger'
import dayjs from 'dayjs'
import { getVideoInformation } from '@libs/youtube'
import { deflateRaw } from 'zlib'
import { VideoFromGoogleApis } from '@libs/types'

const logger = createLogger('/api/pubsubhubbub/http.post.ts')

async function makeDebugData (video: VideoFromGoogleApis, pubsubhubbubBody: string): Promise<string> {
  return await new Promise((resolve, reject) => {
    const input = JSON.stringify({ video, xml: pubsubhubbubBody })
    deflateRaw(input, { level: 9 }, (error, result) => {
      if (error != null) reject(error)
      resolve(result.toString('base64'))
    })
  })
}

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

    const videoFromGoogleApi = await getVideoInformation(video.id)
    if (videoFromGoogleApi === undefined) return response(400)

    if (videoFromGoogleApi.snippet.channelId !== video.channelId) throw new Error('Invalid video')
    const debug = await makeDebugData(videoFromGoogleApi, event.body)

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

    const notifications = subscriberEmails.filter(subscriber => userSet.has(subscriber)).map(subscriber => ({
      video: videoFromGoogleApi,
      subscriber
    }))
    logger.info(`Send notification\n${JSON.stringify(videoFromGoogleApi)}`)
    await sendNotificationEmail(
      notifications,
      channel.information.thumbnails.default?.url ?? 'https://yt3.ggpht.com/ytc/AAUvwnjkjfwolT7enHlIsv2kSn17Ei6Vte8cKIuvVIUtug=s88-c-k-c0x00ffffff-no-rj',
      debug
    )
  }

  logger.debug('<=')
  return response(200, '')
}

export const handler = middyfy(post)
