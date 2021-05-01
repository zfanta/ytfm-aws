import React, { ReactElement, useEffect, useState, Suspense } from 'react'
import cookie from 'cookie'
import { Container, Divider } from '@material-ui/core'
import { useLocation } from 'wouter'
import Header from './Header'
import { setUser } from './storage'
import { profile, signOut as signOutApi } from './api'
import type { ProfileGetResponse } from './api'
import Body from './Body'
import Footer from './Footer'
const SwaggerUI = React.lazy(async () => await import('./SwaggerUI'))

async function getProfile (): Promise<ProfileGetResponse|undefined> {
  const SID: string|undefined = cookie.parse(document.cookie).SID
  if (SID === undefined) return undefined

  const searchParams = new URLSearchParams(window.location.search)
  const token = searchParams.get('token') ?? undefined
  const action = searchParams.get('action') ?? undefined

  try {
    const result = await profile.get(token, action === 'unsubscribe' ? 'unsubscribe' : undefined)
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
  const [swagger, setSwagger] = useState(false)

  useEffect(() => {
    if (location === '/swagger') {
      setSwagger(true)
      return
    }

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

  if (swagger) {
    return (
      <Suspense fallback={<div>Loading Swagger UI</div>}>
        <SwaggerUI />
      </Suspense>
    )
  }

  return (
    <Container maxWidth="sm">
      <Header user={user} signOut={signOut} />
      <Body user={user} setUser={setUser} />
      <Divider/>
      <Footer/>
    </Container>
  )
}

export default App
