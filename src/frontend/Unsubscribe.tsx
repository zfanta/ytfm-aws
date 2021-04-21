import React, { ReactElement, useEffect, useState } from 'react'
import { useLocation } from 'wouter'

async function patchSubscriptions (channel: string, notification: boolean, token: string): Promise<any> {
  return await (await fetch('/api/subscriptions', {
    method: 'PATCH',
    body: JSON.stringify({ channel, notification, token }),
    headers: { 'Content-Type': 'application/json' }
  })).json()
}

async function patchProfile (notification: boolean, token: string): Promise<any> {
  return await (await fetch('/api/profile', {
    method: 'PATCH',
    body: JSON.stringify({ notification, token }),
    headers: { 'Content-Type': 'application/json' }
  })).json()
}

interface ChannelProps {
  channel: {
    id: string
    title: string
  }
  token: string
}
function Channel ({ channel: { id, title }, token }: ChannelProps): ReactElement {
  const [loading, setLoading] = useState(false)
  const [unsubscribed, setUnsubscribed] = useState(false)
  const [resubscribed, setResubscribed] = useState(false)

  async function unsubscribe (): Promise<void> {
    setLoading(true)
    await patchSubscriptions(id, false, token)
    setResubscribed(false)
    setUnsubscribed(true)
    setLoading(false)
  }

  async function subscribe (): Promise<void> {
    setLoading(true)
    await patchSubscriptions(id, true, token)
    setResubscribed(true)
    setUnsubscribed(false)
    setLoading(false)
  }

  useEffect(() => {
    (async () => {
      setLoading(true)
      await patchSubscriptions(id, false, token)
      setUnsubscribed(true)
      setLoading(false)
    })().catch(console.error)
  }, [])

  if (unsubscribed) {
    return (
      <div>
        Successfully unsubscribed {title}. {loading ? <span>TODO: loading</span> : <a onClick={async () => await subscribe()}>Resubscribe.</a>}
      </div>
    )
  }

  if (resubscribed) {
    return (
      <div>
        Successfully resubscribed {title}. {loading ? <span>TODO: loading</span> : <a onClick={async () => await unsubscribe()}>Unsubscribe.</a>}
      </div>
    )
  }

  return <div>TODO: loading</div>
}

interface YtfmProps {
  token: string
}
function Ytfm ({ token }: YtfmProps): ReactElement {
  const [loading, setLoading] = useState(false)
  const [unsubscribed, setUnsubscribed] = useState(false)
  const [resubscribed, setResubscribed] = useState(false)

  async function unsubscribe (): Promise<void> {
    setLoading(true)
    await patchProfile(false, token)
    setResubscribed(false)
    setUnsubscribed(true)
    setLoading(false)
  }

  async function subscribe (): Promise<void> {
    setLoading(true)
    await patchProfile(true, token)
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

interface UnsubscribeProps {
  channelId: string
  token: string
}
function Unsubscribe ({ channelId }: UnsubscribeProps): ReactElement {
  const [, setLocation] = useLocation()
  const [token, setToken] = useState<string>()
  const [channelTitle, setChannelTitle] = useState<string>()

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token')
    const channelTitle = new URLSearchParams(window.location.search).get('channelTitle')
    if (token === null || channelTitle === null) {
      setLocation('/')
    } else {
      setToken(token)
      setChannelTitle(channelTitle)
    }
  }, [])

  if (token === undefined || channelTitle === undefined) {
    return <div>TODO: loading</div>
  }

  return (
    <>
      <Channel channel={{ id: channelId, title: channelTitle }} token={token} />
      <Ytfm token={token} />
    </>
  )
}

export default Unsubscribe
