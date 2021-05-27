import React, { ReactElement, useMemo, useState } from 'react'
import { Avatar, Grid, Box, Checkbox, CircularProgress, NativeSelect } from '@material-ui/core'
import { RefreshSharp } from '@material-ui/icons'
import { useLocation } from 'wouter'
import { useRecoilState, useRecoilValue, useSetRecoilState } from 'recoil'
import { userState, subscriptionsState, errorState } from './recoil'
import * as api from './api'
import type { SubscriptionsGetResponse, ChannelInSubscriptionResponse } from './api'
import Loading from './Loading'

function sortSubscriptions (subscriptions: SubscriptionsGetResponse): SubscriptionsGetResponse {
  subscriptions.channels.sort((a, b) => a.title.localeCompare(b.title))
  return subscriptions
}

interface UnsubscribeYtfmProps {
  token: string
}
function UnsubscribeYtfm ({ token }: UnsubscribeYtfmProps): ReactElement {
  const setUser = useSetRecoilState(userState)
  const [loading, setLoading] = useState(false)
  const [unsubscribed, setUnsubscribed] = useState(false)
  const [resubscribed, setResubscribed] = useState(false)

  async function unsubscribe (): Promise<void> {
    setLoading(true)
    const user = await api.profile.patch({
      notification: false,
      token,
      action: 'unsubscribe'
    })
    setUser(user)
    setResubscribed(false)
    setUnsubscribed(true)
    setLoading(false)
  }

  async function subscribe (): Promise<void> {
    setLoading(true)
    const user = await api.profile.patch({
      notification: true,
      token,
      action: 'unsubscribe'
    })
    setUser(user)
    setResubscribed(true)
    setUnsubscribed(false)
    setLoading(false)
  }

  if (unsubscribed) {
    return (
      <div>
        Successfully unsubscribed YTFM. {loading ? <CircularProgress size="1rem"/> : <a onClick={async () => await subscribe()}>Resubscribe.</a>}
      </div>
    )
  }

  if (resubscribed) {
    return (
      <div>
        Successfully resubscribed YTFM. {loading ? <CircularProgress size="1rem"/> : <a onClick={async () => await unsubscribe()}>Unsubscribe.</a>}
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
  const setError = useSetRecoilState(errorState)

  async function onClickToggle (): Promise<void> {
    setPatching(true)
    await toggle(channel.id)
    setPatching(false)
  }

  if (unsubscribe && channel.notification && !patching) {
    setTimeout(() => {
      onClickToggle().catch(e => setError(e.toString()))
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
      <Grid item xs={2} onClick={onClickToggle} style={{ textAlign: 'right' }}>
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
  const searchParams = new URLSearchParams(window.location.search)
  const token = searchParams.get('token') ?? undefined
  const action = searchParams.get('action') ?? undefined

  const user = useRecoilValue(userState)
  const [, setLocation] = useLocation()
  const [subscriptions, setSubscriptions] = useRecoilState(subscriptionsState({
    user,
    channelId,
    token,
    action: action === 'unsubscribe' ? 'unsubscribe' : undefined
  }))
  const [syncing, setSyncing] = useState(false)

  const [filter, setFilter] = useState<'all'|'enabled'|'disabled'>('all')

  const [done, setDone] = useState(false)
  const unsubscribe = useMemo(() => done ? false : useUnsubscribe(subscriptions, channelId), [subscriptions, done])

  function handleFilterChange ({ target: { value } }: React.ChangeEvent<{ value: string }>): void {
    if (value === 'all' || value === 'enabled' || value === 'disabled') {
      setFilter(value)
    }
  }

  async function onClickSync (): Promise<void> {
    if (user === undefined || user === null) return
    setSyncing(true)
    const subscriptions = await api.subscriptions.post()
    const sorted = sortSubscriptions(subscriptions)
    setSubscriptions(sorted)
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
    setDone(true)
  }

  if (user === null) {
    setLocation('/')
    return <></>
  }
  if (subscriptions === undefined) return <Loading/>

  return (
    <>
      <Grid container spacing={3} alignItems="center">
        {subscriptions.channels.length === 1 && token !== undefined
          ? null
          : <>
              <Grid item xs={10}>Synced at: {subscriptions.syncedAt === undefined ? 'N/A' : new Date(subscriptions.syncedAt).toLocaleString()}</Grid>
              <Grid item xs={2} style={{ textAlign: 'right' }}>{syncing ? <CircularProgress size="1rem" /> : <RefreshSharp onClick={onClickSync} />}</Grid>
            </>
        }
        {channelId === undefined &&
          <Grid item xs={12} style={{ textAlign: 'right' }}>
            <NativeSelect
              value={filter}
              onChange={handleFilterChange}
            >
              <option value="all">all</option>
              <option value="enabled">enabled</option>
              <option value="disabled">disabled</option>
            </NativeSelect>
          </Grid>
        }
        {channelId !== undefined
          ? subscriptions.channels.filter(channel => channel.id === channelId).map(channel =>
              <Subscription key={channel.id} channel={channel} toggle={toggle} unsubscribe={unsubscribe} />
          )
          : subscriptions.channels.filter(channel => {
            if (filter === 'all') return true
            if (filter === 'enabled') return channel.notification
            return !channel.notification
          }).map(channel => (
            <Subscription key={channel.id} channel={channel} toggle={toggle} unsubscribe={unsubscribe} />
          ))
        }
        {action === 'unsubscribe' && token !== undefined ? <UnsubscribeYtfm token={token} /> : null}
      </Grid>
    </>
  )
}

export default Subscriptions
