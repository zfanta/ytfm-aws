import React, { ReactElement, useEffect, useState } from 'react'
import cookie from 'cookie'
import { Container } from '@material-ui/core'
import { useLocation } from 'wouter'
import Header from './Header'
import { setUser } from './storage'
import { profile, signOut as signOutApi } from './api'
import type { ProfileGetResponse } from './api'
import Body from './Body'

async function getProfile (): Promise<ProfileGetResponse|undefined> {
  const SID: string|undefined = cookie.parse(document.cookie).SID
  if (SID === undefined) return undefined

  const searchParams = new URLSearchParams(window.location.search)
  const token = searchParams.get('token') ?? undefined
  const action = searchParams.get('action') ?? undefined

  try {
    const result = await profile.get(token, action)
    setUser(result)
    return result
  } catch (e) {
    // TODO
    return undefined
  }
}

function App (): ReactElement {
  const [user, setUser] = useState<ProfileGetResponse>()
  const [location, setLocation] = useLocation()

  useEffect(() => {
    (async () => {
      const user = await getProfile()
      setUser(user)
      if (user === undefined && location !== '/') {
        setLocation('/')
      } else if (user !== undefined && location === '/') {
        setLocation('/subscriptions')
      }
    })().catch(console.error)
  }, [])

  async function signOut (): Promise<void> {
    try {
      await signOutApi.get()
      setUser(undefined)
    } catch (e) {
      // TODO
      return undefined
    }
  }

  return (
    <Container maxWidth="sm">
      <Header user={user} signOut={signOut} />
      <Body user={user} setUser={setUser} />
    </Container>
  )
}

export default App
