// TODO: use etag
import qs from 'querystring'
import fetch from 'node-fetch'
import { updateGoogleTokenAndPhotos, User } from '@libs/dynamodb'
import { Token } from '@libs/types'
import { refreshToken } from '@libs/oauth2'

async function getSubscriptions (user: User, pageToken?: string): Promise<SubscriptionResponse[]> {
  const token = await refreshGoogleToken(user)

  const url = 'https://www.googleapis.com/youtube/v3/subscriptions'
  const query = qs.stringify({
    access_token: token.access_token,
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

  return [...response.items, ...(await getSubscriptions(user, response.nextPageToken))]
}

async function refreshGoogleToken (user: User): Promise<Token> {
  let token = user.token
  // Refresh token if expired
  const currentTime = new Date()
  if (user.expiresAt < currentTime.valueOf()) {
    const newToken = await refreshToken(token.refresh_token as string)
    token = await updateGoogleTokenAndPhotos(user.email, token, newToken)
  }

  return token
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

export {
  getSubscriptions,
  sendToPubsubhubbub
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
