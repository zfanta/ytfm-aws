import type { ProfileGetResponse, SubscriptionsGetResponse } from './api'
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

function getSubscriptions (user: ProfileGetResponse): SubscriptionsGetResponse|undefined {
  const allSubscriptions = localStorage.getItem('subscriptions')
  if (allSubscriptions === null) return undefined
  const allSubscriptionsParsed = JSON.parse(allSubscriptions)
  return allSubscriptionsParsed[user.email] ?? undefined
}

function clear (): void {
  localStorage.clear()
}

export {
  getUser,
  setUser,
  getSubscriptions,
  setSubscriptions,
  clear
}
