import qs from 'querystring'

interface ProfileGetResponse {
  email: string
  notification: true
  photos: string[]
  updatedAt: number
}
type ProfilePatchResponse = ProfileGetResponse
const profile = {
  get: async (token?: string, action?: 'unsubscribe'): Promise<ProfileGetResponse> => {
    let path = '/api/profile'
    if (token !== undefined && action !== undefined) {
      const query = qs.stringify({ token, action })
      path += `?${query}`
    }
    return await (await fetch(path)).json()
  },
  patch: async (notification: boolean, token?: string, action?: 'unsubscribe'): Promise<ProfilePatchResponse> => {
    return await (await fetch('/api/profile', {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify({ notification, token, action }),
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

export {
  profile,
  cookie,
  subscriptions,
  signOut
}

export type {
  SubscriptionsGetResponse,
  ChannelInSubscriptionResponse,
  ProfileGetResponse
}
