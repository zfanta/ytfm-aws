import { atom, atomFamily, DefaultValue, selector } from 'recoil'
import cookie from 'cookie'
import type { ProfileGetResponse, SubscriptionsGetResponse } from './api'
import { profile, signOut as signOutApi, subscriptions } from './api'
import { clear, getSubscriptions, setSubscriptions, setUser, updateSubscriptions } from './storage'

const userState = atom<ProfileGetResponse|undefined|null>({
  key: 'userState',
  default: undefined,
  effects_UNSTABLE: [
    function loadUser ({ setSelf }) {
      (async () => {
        const searchParams = new URLSearchParams(window.location.search)
        const token = searchParams.get('token') ?? undefined
        const action = searchParams.get('action') ?? undefined

        const SID: string|undefined = cookie.parse(document.cookie).SID
        if (SID === undefined) setSelf(null)

        try {
          const user = await profile.get(token, action === 'unsubscribe' ? 'unsubscribe' : undefined)
          setSelf(user)
          if (user !== null) {
            setUser(user)
          }
        } catch (e) {
          setSelf(null)
          // TODO
          console.error(e)
        }
      })().catch(console.error)
    }
  ]
})

const signOutSelector = selector<null>({
  key: 'signOutSelector',
  get: () => { throw new Error('Do not use `signOutSelector.get`') },
  set: ({ set }) => {
    signOutApi.get()
      .then(() => {
        clear(['user', 'subscriptions'])
        set(userState, null)
      })
      .catch(console.error)
  }
})

const switchAccountSelector = selector<null>({
  key: 'switchAccountSelector',
  get: () => { throw new Error('Do not use `switchAccountSelector.get`') },
  set: ({ set }) => {
    signOutApi.get()
      .then(() => {
        clear(['user'])
        set(userState, null)
      })
      .catch(console.error)
  }
})

const subscriptionsState = atomFamily<SubscriptionsGetResponse|undefined, {
  user: Readonly<ProfileGetResponse>|undefined|null
  channelId?: string
  token?: string
  action?: 'unsubscribe'
}>({
  key: 'subscriptionsState',
  default: undefined,
  effects_UNSTABLE: ({ action, channelId, token, user }) => [
    function loadSubscriptions ({ setSelf }) {
      if (channelId !== undefined) {
        subscriptions.get(channelId, token, action).then(setSelf).catch(console.error)
        return
      }

      if (user === undefined || user === null) return

      const fromStorage = getSubscriptions(user)
      if (fromStorage !== undefined && fromStorage.updatedAt === user.updatedAt) {
        setSelf(fromStorage)
        return
      }

      subscriptions.get()
        .then(subscriptions => {
          subscriptions.channels.sort((a, b) => a.title.localeCompare(b.title))
          setSubscriptions(user, subscriptions)
          setSelf(subscriptions)
        })
        .catch(console.error)
    },
    function onSet ({ onSet }) {
      onSet(newValue => {
        if (user === null || user === undefined || newValue === undefined || newValue instanceof DefaultValue) return

        if (channelId !== undefined) {
          const channel = newValue.channels.find(channel => channel.id === channelId)
          if (channel === undefined || newValue.updatedAt === undefined) {
            throw new Error('Failed set subscriptions.')
          }
          updateSubscriptions(user, channel, newValue.updatedAt)
        } else {
          setSubscriptions(user, newValue)
        }
      })
    }
  ]
})

export {
  userState,
  signOutSelector,
  switchAccountSelector,
  subscriptionsState
}