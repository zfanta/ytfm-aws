import qs from 'querystring'

interface ProfileGetResponse {
  email: string
  notification: true
  photos: string[]
  updatedAt: number
  region: string|undefined
}
type ProfilePatchResponse = ProfileGetResponse
interface ProfileFetchProps {
  region?: string
  notification?: boolean
  token?: string
  action?: string
}
const profile = {
  get: async (token?: string, action?: 'unsubscribe'): Promise<ProfileGetResponse|null> => {
    let path = '/api/profile'
    if (token !== undefined && action !== undefined) {
      const query = qs.stringify({ token, action })
      path += `?${query}`
    }

    const response = await fetch(path)
    if (response.status === 400 || response.status === 401) return null
    return await response.json()
  },
  patch: async (props: ProfileFetchProps): Promise<ProfilePatchResponse> => {
    const { region, notification, token, action } = props

    return await (await fetch('/api/profile', {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify({ region, notification, token, action }),
      headers: {
        'Content-Type': 'application/json'
      }
    })).json()
  },
  delete: async (): Promise<void> => {
    await fetch('/api/profile', { method: 'DELETE', credentials: 'include' })
  }
}

const cookie = {
  get: async (): Promise<void> => {
    await fetch('/api/cookie')
  }
}

export interface VideoFromGoogleApis {
  'kind': string
  'etag': string
  'id': string
  'snippet': {
    'publishedAt': string
    'channelId': string
    'title': string
    'description': string
    'thumbnails': {
      [key: string]: {
        'url': string
        'width': number
        'height': number
      }
    }
    'channelTitle': string
    'tags': string[]
    'categoryId': string
    'liveBroadcastContent': 'live' | 'none' | 'upcoming'
    'defaultLanguage': string
    'localized': {
      'title': string
      'description': string
    }
    'defaultAudioLanguage': string
  }
  'contentDetails': {
    'duration': string // https://en.wikipedia.org/wiki/ISO_8601#Durations
    'dimension': string
    'definition': string
    'caption': string
    'licensedContent': boolean
    'contentRating': {}
    'projection': string
  }
  'status': {
    'uploadStatus': string
    'privacyStatus': string
    'license': string
    'embeddable': boolean
    'publicStatsViewable': boolean
    'madeForKids': boolean
  }
  'player': {
    'embedHtml': string
  }
}
const video = {
  get: async (videoId: string): Promise<VideoFromGoogleApis> => {
    const response = await fetch(`/api/video/${videoId}`)
    if (response.status === 404) throw new Error('Cannot find video')
    return await (response).json()
  }
}

interface SubscriptionsGetResponse {
  syncedAt?: number
  updatedAt?: number
  channels: ChannelInSubscriptionResponse[]
}
type SubscriptionsPostResponse = SubscriptionsGetResponse
interface ChannelInSubscriptionResponse {
  id: string
  title: string
  notification: boolean
  thumbnail: string
}
interface SubscriptionsPatchResponse {
  channel: string
  notification: boolean
  updatedAt: number
}
const subscriptions = {
  get: async (channelId?: string, token?: string, action?: 'unsubscribe'): Promise<SubscriptionsGetResponse> => {
    let path = `/api/subscriptions${channelId === undefined ? '' : `/${channelId}`}`
    if (token !== undefined && action !== undefined) {
      const query = qs.stringify({ token, action })
      path += `?${query}`
    }
    return await (await fetch(path, { credentials: 'include' })).json()
  },
  post: async (): Promise<SubscriptionsPostResponse> => {
    return await (await fetch('/api/subscriptions', { method: 'POST', credentials: 'include' })).json()
  },
  patch: async (channel: string, notification: boolean, token?: string, action?: 'unsubscribe'): Promise<SubscriptionsPatchResponse> => {
    return await (await fetch(`/api/subscriptions/${channel}`, {
      credentials: 'include',
      method: 'PATCH',
      body: JSON.stringify({ notification, token, action }),
      headers: { 'Content-Type': 'application/json' }
    })).json()
  }
}

const signOut = {
  get: async (): Promise<void> => {
    await fetch('/api/signOut')
  }
}

interface Region {
  id: string
  name: string
}
const regions = {
  get: async (language: string): Promise<Region[]> => {
    return await (await fetch(`/api/regions/${language}`)).json()
  }
}

export {
  profile,
  cookie,
  subscriptions,
  signOut,
  video,
  regions
}

export type {
  SubscriptionsGetResponse,
  ChannelInSubscriptionResponse,
  ProfileGetResponse,
  Region
}
