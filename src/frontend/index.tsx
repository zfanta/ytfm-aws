import 'regenerator-runtime/runtime'

import React, { ReactElement, useEffect, useState } from 'react'
import ReactDOM from 'react-dom'
import cookie from 'cookie'
import qs from 'query-string'

async function getCookie (): Promise<void> {
  await fetch('/api/cookie')
}

async function checkSignedIn (): Promise<{user: string}> {
  const { SID } = cookie.parse(document.cookie)
  if (SID === undefined) throw new Error('Not found')
  try {
    return await (await fetch('/api/profile')).json()
  } catch (e) {
    throw new Error('Not found')
  }
}

function App (): ReactElement {
  const SID: string = cookie.parse(document.cookie).SID ?? ''

  const query: string = qs.stringify({
    client_id: '969455847018-a7agkq11k0p97jumrronqnrtctfu45pp.apps.googleusercontent.com',
    // TODO: replace dev to variable
    redirect_uri: 'https://dev.ytfm.app/api/oauth2',
    state: `SID=${SID}`,
    response_type: 'code',
    scope: 'email https://www.googleapis.com/auth/youtube.readonly',
    approval_prompt: 'auto',
    access_type: 'offline'
  })

  const [email, setEmail] = useState<string>()

  useEffect(() => {
    checkSignedIn().then(profile => setEmail(profile.user)).catch(console.error)
  }, [])

  return (
    <>
      <div onClick={getCookie}>Allow cookie</div>
      <div>SID={SID}</div>
      <div>email={email}</div>
      <a href={`https://accounts.google.com/o/oauth2/auth?${query}`}>Sign in</a>
      <a href="/api/signOut">Sign out</a>
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))
