import React, { ReactElement, useEffect, useState } from 'react'
import { Avatar, Grid, Box, Checkbox, CircularProgress } from '@material-ui/core'
import { RefreshSharp } from '@material-ui/icons'
import { getUser, getSubscriptions as getSubscriptionsFromStorage, setSubscriptions as setSubscriptionsInStorage } from './storage'

function sortSubscriptions (subscriptions: SubscriptionsResponse): SubscriptionsResponse {
  subscriptions.channels.sort((a, b) => a.title.localeCompare(b.title))
  return subscriptions
}

async function getSubscriptions (): Promise<SubscriptionsResponse> {
  const user = getUser()
  if (user !== undefined) {
    const subscriptions = getSubscriptionsFromStorage(user)
    if (subscriptions !== undefined && subscriptions.updatedAt === user.updatedAt) return subscriptions
  }

  const subscriptions = await (await fetch('/api/subscriptions', { mode: 'cors', credentials: 'include' })).json()
  const sorted = sortSubscriptions(subscriptions)
  if (user !== undefined) {
    setSubscriptionsInStorage(user, sorted)
  }
  return sorted
}

async function syncSubscriptions (): Promise<SubscriptionsResponse> {
  const subscriptions = await (await fetch('/api/subscriptions', { method: 'POST', mode: 'cors', credentials: 'include' })).json()
  const sorted = sortSubscriptions(subscriptions)
  const user = getUser()
  if (user !== undefined) {
    setSubscriptionsInStorage(user, sorted)
  }
  return sorted
}

function Subscription ({ channel, toggle }: {channel: Channel, toggle: (string) => Promise<void>}): ReactElement {
  const [patching, setPatching] = useState(false)

  async function onClickToggle (): Promise<void> {
    setPatching(true)
    await toggle(channel.id)
    setPatching(false)
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

function Subscriptions (): ReactElement {
  const [subscriptions, setSubscriptions] = useState<SubscriptionsResponse>()
  const [syncing, setSyncing] = useState(false)

  useEffect(() => {
    getSubscriptions().then(setSubscriptions).catch(console.error)
  }, [])

  async function onClickSync (): Promise<void> {
    setSyncing(true)
    const result = await syncSubscriptions()
    setSubscriptions(result)
    setSyncing(false)
  }

  async function toggle (channelId: string): Promise<void> {
    if (subscriptions === undefined || subscriptions.channels === undefined) throw new Error('Channel not found')

    const targetChannel = subscriptions.channels.find(channel => channel.id === channelId)
    if (targetChannel === undefined) throw new Error('Channel not found')

    const response = await (await fetch('/api/subscriptions', {
      mode: 'cors',
      credentials: 'include',
      method: 'PATCH',
      body: JSON.stringify({ channel: channelId, notification: !targetChannel.notification }),
      headers: { 'Content-Type': 'application/json' }
    })).json()

    const targetIndex = subscriptions.channels.findIndex(channel => channel.id === channelId)

    const channels = [
      ...subscriptions.channels.slice(0, targetIndex),
      {
        id: targetChannel.id,
        title: targetChannel.title,
        notification: !targetChannel.notification,
        thumbnail: targetChannel.thumbnail
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
      setSubscriptionsInStorage(user, newSubscriptions)
    }
  }

  if (subscriptions === undefined) return <div>TODO: loading</div>

  return (
    <>
      <Grid container spacing={3} alignItems="center">
        <Grid item xs={10}>Synced at: {subscriptions.syncedAt === undefined ? 'N/A' : new Date(subscriptions.syncedAt).toLocaleString()}</Grid>
        <Grid item xs={2}>{syncing ? <CircularProgress size="1rem" /> : <RefreshSharp onClick={onClickSync} />}</Grid>
        {subscriptions.channels.map(channel => <Subscription key={channel.id} channel={channel} toggle={toggle} />)}
      </Grid>
    </>
  )
}

export default Subscriptions
export type {
  SubscriptionsResponse
}

interface SubscriptionsResponse {
  syncedAt?: number
  updatedAt?: number
  channels: Channel[]
}
interface Channel {
  id: string
  title: string
  notification: boolean
  thumbnail: string
}
