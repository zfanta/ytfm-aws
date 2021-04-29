import React, { ReactElement, useEffect, useMemo, useState } from 'react'
import { Avatar, Grid, Box, Checkbox, CircularProgress } from '@material-ui/core'
import { RefreshSharp } from '@material-ui/icons'
import {
  getUser,
  getSubscriptions as getSubscriptionsFromStorage,
  setSubscriptions as setSubscriptionsInStorage,
  updateSubscriptions as updateSubscriptionsInStorage
} from './storage'
import * as api from './api'
import type { SubscriptionsGetResponse, ChannelInSubscriptionResponse } from './api'

function sortSubscriptions (subscriptions: SubscriptionsGetResponse): SubscriptionsGetResponse {
  subscriptions.channels.sort((a, b) => a.title.localeCompare(b.title))
  return subscriptions
}

async function getSubscriptions (channelId?: string, token?: string, action?: 'unsubscribe'): Promise<SubscriptionsGetResponse> {
  if (channelId !== undefined) {
    return await api.subscriptions.get(channelId, token, action)
  }

  const user = getUser()
  if (user !== undefined) {
    const subscriptions = getSubscriptionsFromStorage(user)
    if (subscriptions !== undefined && subscriptions.updatedAt === user.updatedAt) return subscriptions
  }

  const subscriptions = await api.subscriptions.get()
  const sorted = sortSubscriptions(subscriptions)
  if (user !== undefined) {
    setSubscriptionsInStorage(user, sorted)
  }
  return sorted
}

async function syncSubscriptions (): Promise<SubscriptionsGetResponse> {
  const subscriptions = await api.subscriptions.post()
  const sorted = sortSubscriptions(subscriptions)
  const user = getUser()
  if (user !== undefined) {
    setSubscriptionsInStorage(user, sorted)
  }
  return sorted
}

interface UnsubscribeYtfmProps {
  token: string
}
function UnsubscribeYtfm ({ token }: UnsubscribeYtfmProps): ReactElement {
  const [loading, setLoading] = useState(false)
  const [unsubscribed, setUnsubscribed] = useState(false)
  const [resubscribed, setResubscribed] = useState(false)

  async function unsubscribe (): Promise<void> {
    setLoading(true)
    await api.profile.patch(false, token, 'unsubscribe')
    setResubscribed(false)
    setUnsubscribed(true)
    setLoading(false)
  }

  async function subscribe (): Promise<void> {
    setLoading(true)
    await api.profile.patch(true, token, 'unsubscribe')
    setResubscribed(true)
    setUnsubscribed(false)
    setLoading(false)
  }

  if (unsubscribed) {
    return (
      <div>
        Successfully unsubscribed YTFM. {loading ? <span>TODO: loading</span> : <a onClick={async () => await subscribe()}>Resubscribe.</a>}
      </div>
    )
  }

  if (resubscribed) {
    return (
      <div>
        Successfully resubscribed YTFM. {loading ? <span>TODO: loading</span> : <a onClick={async () => await unsubscribe()}>Unsubscribe.</a>}
      </div>
    )
  }

  return (
    <div>
      <a onClick={async () => await unsubscribe()}>Unsubscribe YTFM</a>
    </div>
  )
}

function Subscription ({ channel, toggle, unsubscribe }: {channel: ChannelInSubscriptionResponse, toggle: (string) => Promise<void>, unsubscribe: boolean}): ReactElement {
  const [patching, setPatching] = useState(false)

  async function onClickToggle (): Promise<void> {
    setPatching(true)
    await toggle(channel.id)
    setPatching(false)
  }

  if (unsubscribe && channel.notification && !patching) {
    setTimeout(() => {
      onClickToggle().catch(console.error)
    }, 0)
  }

  return (
    <>
      <Grid item xs={2}>
        <a href={`https://www.youtube.com/channel/${channel.id}`} target="_blank" style={{ color: 'black', textDecoration: 'none' }}>
          <Avatar alt={channel.title} src={channel.thumbnail} style={{ width: '50px', height: '50px' }} />
        </a>
      </Grid>
      <Grid item xs={8}>
        <Box component="span"><a href={`https://www.youtube.com/channel/${channel.id}`} target="_blank">{channel.title}</a></Box>
      </Grid>
      <Grid item xs={2} onClick={onClickToggle}>
        {patching ? <CircularProgress size="1rem" /> : <Checkbox checked={channel.notification} color="primary" />}
      </Grid>
    </>
  )
}

function useUnsubscribe (subscriptions: SubscriptionsGetResponse|undefined, channelId: string|undefined): boolean {
  let unsubscribe = false

  const searchParams = new URLSearchParams(window.location.search)
  const action = searchParams.get('action') ?? undefined

  if (action !== 'unsubscribe') return false
  if (channelId === undefined) return false
  if (subscriptions === undefined) return false
  if (subscriptions.channels.length !== 1) return false

  if (subscriptions.channels[0].notification) {
    unsubscribe = true
  }

  return unsubscribe
}

interface SubscriptionsProps {
  channelId?: string
}
function Subscriptions ({ channelId }: SubscriptionsProps): ReactElement {
  const [subscriptions, setSubscriptions] = useState<SubscriptionsGetResponse>()
  const [syncing, setSyncing] = useState(false)

  const [done, setDone] = useState(false)
  const unsubscribe = useMemo(() => done ? false : useUnsubscribe(subscriptions, channelId), [subscriptions, done])

  const searchParams = new URLSearchParams(window.location.search)
  const token = searchParams.get('token') ?? undefined
  const action = searchParams.get('action') ?? undefined

  useEffect(() => {
    getSubscriptions(channelId, token, action === 'unsubscribe' ? 'unsubscribe' : undefined).then(setSubscriptions).catch(console.error)
  }, [])

  async function onClickSync (): Promise<void> {
    setSyncing(true)
    const result = await syncSubscriptions()
    setSubscriptions(result)
    setSyncing(false)
  }

  async function toggle (channelIdToToggle: string): Promise<void> {
    if (subscriptions === undefined || subscriptions.channels === undefined) throw new Error('Channel not found')

    const targetChannel = subscriptions.channels.find(channel => channel.id === channelIdToToggle)
    if (targetChannel === undefined) throw new Error('Channel not found')

    const response = await api.subscriptions.patch(channelIdToToggle, !targetChannel.notification, token, 'unsubscribe')

    const targetIndex = subscriptions.channels.findIndex(channel => channel.id === channelIdToToggle)

    const channels = [
      ...subscriptions.channels.slice(0, targetIndex),
      {
        ...targetChannel,
        notification: !targetChannel.notification
      },
      ...subscriptions.channels.slice(targetIndex + 1)
    ]

    const newSubscriptions = Object.assign({}, subscriptions, {
      channels,
      updatedAt: response.updatedAt
    })
    setSubscriptions(newSubscriptions)
    const user = getUser()
    if (user !== undefined) {
      if (channelId !== undefined) {
        updateSubscriptionsInStorage(user, {
          ...targetChannel,
          notification: !targetChannel.notification
        }, response.updatedAt)
      } else {
        setSubscriptionsInStorage(user, newSubscriptions)
      }
    }
    setDone(true)
  }

  if (subscriptions === undefined) return <div>TODO: loading</div>

  return (
    <>
      <Grid container spacing={3} alignItems="center">
        {subscriptions.channels.length === 1 && token !== undefined
          ? null
          : <>
              <Grid item xs={10}>Synced at: {subscriptions.syncedAt === undefined ? 'N/A' : new Date(subscriptions.syncedAt).toLocaleString()}</Grid>
              <Grid item xs={2}>{syncing ? <CircularProgress size="1rem" /> : <RefreshSharp onClick={onClickSync} />}</Grid>
            </>
        }
        {subscriptions.channels.map(channel => (
          <Subscription key={channel.id} channel={channel} toggle={toggle} unsubscribe={unsubscribe} />
        ))}
        {action === 'unsubscribe' && token !== undefined ? <UnsubscribeYtfm token={token} /> : null}
      </Grid>
    </>
  )
}

export default Subscriptions
