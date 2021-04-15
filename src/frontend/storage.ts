import { SubscriptionsResponse } from './Subscriptions'
import { User } from './Header'

function setUser (user: User): void {
  localStorage.setItem('user', JSON.stringify(user))
}

function getUser (): User|undefined {
  const user = localStorage.getItem('user')
  if (user === null) return undefined
  return JSON.parse(user)
}

function setSubscriptions (user: User, subscriptions: SubscriptionsResponse): void {
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

function getSubscriptions (user: User): SubscriptionsResponse|undefined {
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
