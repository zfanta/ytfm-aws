import React, { ReactElement, useEffect, useState } from 'react'
import cookie from 'cookie'
import { Container } from '@material-ui/core'
import { Switch, Route, useLocation } from 'wouter'
import Subscriptions from './Subscriptions'
import Profile from './Profile'
import Header, { User } from './Header'
import { setUser } from './storage'
import Unsubscribe from './Unsubscribe'
import { profile, signOut as signOutApi } from './api'

async function getProfile (): Promise<User|undefined> {
  const SID: string|undefined = cookie.parse(document.cookie).SID
  if (SID === undefined) return undefined

  try {
    const result = await profile.get()
    setUser(result)
    return result
  } catch (e) {
    // TODO
    return undefined
  }
}

function App (): ReactElement {
  const [user, setUser] = useState<User>()
  const [location, setLocation] = useLocation()

  useEffect(() => {
    if (!location.startsWith('/unsubscribe')) {
      getProfile().then(setUser).catch(console.error)
    }
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
      {location.startsWith('/unsubscribe')
        ? <Switch>
            <Route path="/unsubscribe">
              {() => { setLocation('/'); return <></> }}
            </Route>
            <Route path="/unsubscribe/:channelId">
              {params => <Unsubscribe channelId={params.channelId} />}
            </Route>
          </Switch>
        : user === undefined
          ? <div>TODO: main</div>
          : <Switch>
            <Route path="/" component={Subscriptions} />
            <Route path="/profile">
              <Profile user={user} setUser={setUser} />
            </Route>
          </Switch>
      }
    </Container>
  )
}

export default App
