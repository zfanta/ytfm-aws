import qs from 'querystring'
import fetch from 'node-fetch'
import { updateGoogleTokenAndPhotos, User, getUser } from '@libs/dynamodb'
import { refreshToken } from '@libs/oauth2'
import { VideoFromGoogleApis, VideoResponse } from '@libs/types'

async function getSubscriptions (user: User, pageToken?: string): Promise<SubscriptionResponse[]> {
  const userRefreshed = await refreshGoogleToken(user)

  const url = 'https://www.googleapis.com/youtube/v3/subscriptions'
  const query = qs.stringify({
    access_token: userRefreshed.token.access_token,
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

  return [...response.items, ...(await getSubscriptions(userRefreshed, response.nextPageToken))]
}

async function refreshGoogleToken (user: User): Promise<User> {
  const token = user.token
  // Refresh token if expired
  const currentTime = new Date()
  if (currentTime.valueOf() < user.expiresAt) {
    return user
  }

  const newToken = await refreshToken(token.refresh_token as string)
  await updateGoogleTokenAndPhotos(user.email, token, newToken)
  return await getUser(user.email) as User
}

async function sendToPubsubhubbub (channelIds: string[], mode: 'subscribe'|'unsubscribe'): Promise<void> {
  async function send (channelId: string, mode: string): Promise<void> {
    const stage = process.env.STAGE
    if (stage === undefined) throw new Error('STAGE is undefined')

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
    const body = {
      // 'hub.lease_seconds': 10,
      'hub.callback': `https://${stage}.ytfm.app/api/pubsubhubbub`,
      'hub.mode': mode,
      'hub.topic': `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`,
      'hub.verify': 'async'
      // 'hub.secret': APP_SECRET_KEY
    }
    await fetch('https://pubsubhubbub.appspot.com/', {
      method: 'post',
      headers,
      body: qs.stringify(body)
    })
  }

  await Promise.all(channelIds.map(async channelId => {
    if (channelId === undefined) throw new Error('Channel id is undefined')
    if (mode === undefined) throw new Error('mode id is undefined')

    return await send(channelId, mode)
  }))
}

interface GetRegionsResponse {
  kind: 'youtube#i18nRegionListResponse'
  etag: string
  items: Array<{
    kind: 'youtube#i18nRegion'
    etag: string
    id: string
    snippet: {
      gl: string
      name: string
    }
  }>
}
async function getRegions (language: string): Promise<GetRegionsResponse>
async function getRegions (language: string, etag: string): Promise<GetRegionsResponse|'Not Modified'>
async function getRegions (language: string, etag?: string): Promise<GetRegionsResponse|'Not Modified'> {
  const query = qs.stringify({
    part: 'snippet',
    hl: language,
    key: process.env.GOOGLE_API_KEY
  })

  const url = `https://www.googleapis.com/youtube/v3/i18nRegions?${query}`

  let regions: GetRegionsResponse
  if (etag !== undefined) {
    const headers = {
      'If-None-Match': etag
    }
    const response = await fetch(url, { headers })
    if (response.status === 304) return 'Not Modified'
    regions = await response.json() as GetRegionsResponse
  } else {
    regions = await (await fetch(url)).json() as GetRegionsResponse
  }

  regions.items = regions.items.sort((a, b) => a.snippet.name.localeCompare(b.snippet.name))

  return regions
}

async function getVideoInformation (videoId: string): Promise<VideoFromGoogleApis|undefined> {
  if (process.env.GOOGLE_API_KEY === undefined) throw new Error('GOOGLE_API_KEY is undefined')

  const query = qs.stringify({
    id: videoId,
    part: 'id,snippet,contentDetails,player,status,liveStreamingDetails',
    key: process.env.GOOGLE_API_KEY
  })

  const response: VideoResponse = await (await fetch(`https://www.googleapis.com/youtube/v3/videos?${query}`)).json()

  if (response.items.length === 0) return undefined

  return response.items[0]
}

export {
  getSubscriptions,
  sendToPubsubhubbub,
  getRegions,
  getVideoInformation
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

export type {
  SubscriptionResponse
}
