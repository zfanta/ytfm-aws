interface ProfileGetResponse {
  email: string
  notification: true
  photos: string[]
  updatedAt: number
}
type ProfilePatchResponse = ProfileGetResponse
const profile = {
  get: async (): Promise<ProfileGetResponse> => {
    return await (await fetch('/api/profile')).json()
  },
  patch: async (notification: boolean, token?: string): Promise<ProfilePatchResponse> => {
    return await (await fetch('/api/profile', {
      method: 'PATCH',
      credentials: 'include',
      body: JSON.stringify({ notification, token }),
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
  get: async (): Promise<SubscriptionsGetResponse> => {
    return await (await fetch('/api/subscriptions', { credentials: 'include' })).json()
  },
  post: async (): Promise<SubscriptionsPostResponse> => {
    return await (await fetch('/api/subscriptions', { method: 'POST', credentials: 'include' })).json()
  },
  patch: async (channel: string, notification: boolean, token?: string): Promise<SubscriptionsPatchResponse> => {
    return await (await fetch('/api/subscriptions', {
      credentials: 'include',
      method: 'PATCH',
      body: JSON.stringify({ channel, notification, token }),
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
