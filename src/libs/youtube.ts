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
    token = await updateGoogleTokenAndPhotos(user.email, newToken)
  }

  return token
}

export {
  getSubscriptions
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
