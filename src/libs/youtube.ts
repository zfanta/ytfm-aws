// TODO: use etag
import qs from 'querystring'
import fetch from 'node-fetch'
import { updateGoogleTokenAndPhotos, User, getUser } from '@libs/dynamodb'
import { refreshToken } from '@libs/oauth2'

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

async function getChannel (channelId: string): Promise<ChannelResponse|undefined>
async function getChannel (channelId: string, etag?: string): Promise<ChannelResponse|undefined|'Not Modified'> {
  const query = qs.stringify({
    part: 'snippet, id',
    id: channelId,
    key: process.env.GOOGLE_API_KEY
  })

  const headers = etag !== undefined
    ? {
        'If-None-Match': etag
      }
    : undefined

  const url = `https://www.googleapis.com/youtube/v3/channels?${query}`

  const response = await fetch(url, { headers })

  if (response.status === 304) return 'Not Modified'

  const parsed = await response.json() as ChannelsResponse

  if (parsed.items === undefined || parsed.items.length === 0) return undefined

  return parsed.items[0]
}

export {
  getSubscriptions,
  sendToPubsubhubbub,
  getRegions,
  getChannel
}

interface ChannelResponse {
  'kind': 'youtube#channel'
  'etag': string
  'id': string
  'snippet': {
    'title': string
    'description': string
    'customUrl': string
    'publishedAt': string
    'thumbnails': Partial<Record<'default'|'medium'|'high', {
      'url': string
      'width': number
      'height': number
    }>>
    'defaultLanguage': string
    'localized': {
      'title': string
      'description': string
    }
    'country': string
  }
  'contentDetails': {
    'relatedPlaylists': {
      'likes': string
      'favorites': string
      'uploads': string
    }
  }
  'statistics': {
    'viewCount': number
    'subscriberCount': number
    'hiddenSubscriberCount': boolean
    'videoCount': number
  }
  'topicDetails': {
    'topicIds': [
      string
    ]
    'topicCategories': [
      string
    ]
  }
  'status': {
    'privacyStatus': string
    'isLinked': boolean
    'longUploadsStatus': string
    'madeForKids': boolean
    'selfDeclaredMadeForKids': boolean
  }
  'brandingSettings': {
    'channel': {
      'title': string
      'description': string
      'keywords': string
      'trackingAnalyticsAccountId': string
      'moderateComments': boolean
      'unsubscribedTrailer': string
      'defaultLanguage': string
      'country': string
    }
    'watch': {
      'textColor': string
      'backgroundColor': string
      'featuredPlaylistId': string
    }
  }
  'auditDetails': {
    'overallGoodStanding': boolean
    'communityGuidelinesGoodStanding': boolean
    'copyrightStrikesGoodStanding': boolean
    'contentIdClaimsGoodStanding': boolean
  }
  'contentOwnerDetails': {
    'contentOwner': string
    'timeLinked': string
  }
  'localizations': (key) => {
    'title': string
    'description': string
  }
}
interface ChannelsResponse {
  'kind': 'youtube#channelListResponse'
  'etag': string
  'nextPageToken': string
  'prevPageToken': string
  'pageInfo': {
    'totalResults': number
    'resultsPerPage': number
  }
  'items': ChannelResponse[]
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
