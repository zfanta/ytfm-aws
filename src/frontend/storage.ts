import type { ChannelInSubscriptionResponse, ProfileGetResponse, SubscriptionsGetResponse } from './api'

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
}

function updateSubscriptions (user: ProfileGetResponse, channel: ChannelInSubscriptionResponse, updatedAt: number): void {
  const subscriptions = getSubscriptions(user)

  if (subscriptions === undefined) return

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

function clear (emailAddress: string): void {
  const allSubscriptions = localStorage.getItem('subscriptions')
  if (allSubscriptions === null) return undefined
  const allSubscriptionsParsed = JSON.parse(allSubscriptions)
  const result = Object.keys(allSubscriptionsParsed).filter(email => email !== emailAddress).reduce<any>((obj, key) => {
    obj[key] = allSubscriptionsParsed[key]
    return obj
  }, {})
  localStorage.setItem('subscriptions', JSON.stringify(result))
}

export {
  getSubscriptions,
  setSubscriptions,
  updateSubscriptions,
  clear
}
