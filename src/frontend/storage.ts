import type { ChannelInSubscriptionResponse, ProfileGetResponse, SubscriptionsGetResponse } from './api'
// TODO: integrate with api.ts. call this in api.ts not in tsx.

function setUser (user: ProfileGetResponse): void {
  localStorage.setItem('user', JSON.stringify(user))
}

function getUser (): ProfileGetResponse|undefined {
  const user = localStorage.getItem('user')
  if (user === null) return undefined
  return JSON.parse(user)
}

function setSubscriptions (user: ProfileGetResponse, subscriptions: SubscriptionsGetResponse): void {
  const allSubscriptions = localStorage.getItem('subscriptions')
  if (allSubscriptions === null) {
    localStorage.setItem('subscriptions', JSON.stringify({
      [user.email]: subscriptions
    }))
  } else {
    const allSubscriptionsParsed = JSON.parse(allSubscriptions)
    localStorage.setItem('subscriptions', JSON.stringify(Object.assign(allSubscriptionsParsed, {
      [user.email]: subscriptions
    })))
  }

  setUser(Object.assign(user, {
    updatedAt: subscriptions.updatedAt
  }))
}

function updateSubscriptions (user: ProfileGetResponse, channel: ChannelInSubscriptionResponse, updatedAt: number): void {
  const subscriptions = getSubscriptions(user) as SubscriptionsGetResponse
  const targetIndex = subscriptions.channels.findIndex(_channel => _channel.id === channel.id)
  const channels = [
    ...subscriptions.channels.slice(0, targetIndex),
    {
      ...channel,
      notification: channel.notification
    },
    ...subscriptions.channels.slice(targetIndex + 1)
  ]

  const newSubscriptions = Object.assign({}, subscriptions, {
    channels,
    updatedAt
  })

  setSubscriptions(user, newSubscriptions)
}

function getSubscriptions (user: ProfileGetResponse): SubscriptionsGetResponse|undefined {
  const allSubscriptions = localStorage.getItem('subscriptions')
  if (allSubscriptions === null) return undefined
  const allSubscriptionsParsed = JSON.parse(allSubscriptions)
  return allSubscriptionsParsed[user.email] ?? undefined
}

function clear (keys: Array<'user'|'subscriptions'>): void {
  const user = getUser()

  if (keys.includes('user')) {
    localStorage.removeItem('user')
  }

  if (keys.includes('subscriptions')) {
    if (user === undefined) return
    const allSubscriptions = localStorage.getItem('subscriptions')
    if (allSubscriptions === null) return undefined
    const allSubscriptionsParsed = JSON.parse(allSubscriptions)
    const result = Object.keys(allSubscriptionsParsed).filter(email => email !== user.email).reduce<any>((obj, key) => {
      obj[key] = allSubscriptionsParsed[key]
      return obj
    }, {})
    localStorage.setItem('subscriptions', JSON.stringify(result))
  }
}

export {
  getUser,
  setUser,
  getSubscriptions,
  setSubscriptions,
  updateSubscriptions,
  clear
}
