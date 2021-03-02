import React, { ReactElement, useEffect, useState } from 'react'
import cookie from 'cookie'
import { Container } from '@material-ui/core'
import Subscriptions from './Subscriptions'
import Header from './Header'

async function getProfile (): Promise<{ email: string }|undefined> {
  const SID: string|undefined = cookie.parse(document.cookie).SID
  if (SID === undefined) return undefined

  try {
    return await (await fetch('/api/profile')).json()
  } catch (e) {
    // TODO
    return undefined
  }
}

function App (): ReactElement {
  const [user, setUser] = useState<{email: string}>()

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
      {user === undefined ? <div>TODO</div> : <Subscriptions />}
    </Container>
  )
}

export default App
