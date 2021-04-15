import React, { ReactElement, useEffect, useState } from 'react'
import cookie from 'cookie'
import { Container } from '@material-ui/core'
import { Switch, Route } from 'wouter'
import Subscriptions from './Subscriptions'
import Profile from './Profile'
import Header, { User } from './Header'
import { setUser } from './storage'

async function getProfile (): Promise<User|undefined> {
  const SID: string|undefined = cookie.parse(document.cookie).SID
  if (SID === undefined) return undefined

  try {
    const result = await (await fetch('/api/profile')).json()
    setUser(result)
    return result
  } catch (e) {
    // TODO
    return undefined
  }
}

function App (): ReactElement {
  const [user, setUser] = useState<User>()

  useEffect(() => {
    getProfile().then(setUser).catch(console.error)
  }, [])

  async function signOut (): Promise<void> {
    try {
      await fetch('/api/signOut')
      setUser(undefined)
    } catch (e) {
      // TODO
      return undefined
    }
  }

  return (
    <Container maxWidth="sm">
      <Header user={user} signOut={signOut} />
      {user === undefined
        ? <div>TODO</div>
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
