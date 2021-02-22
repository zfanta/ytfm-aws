import 'regenerator-runtime/runtime'

import React, { ReactElement } from 'react'
import ReactDOM from 'react-dom'
import cookie from 'cookie'
import qs from 'query-string'

async function getCookie (): Promise<void> {
  await fetch('/api/cookie')
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

  return (
    <>
      <div onClick={getCookie}>Allow cookie</div>
      <div>SID={SID}</div>
      <a href={`https://accounts.google.com/o/oauth2/auth?${query}`}>Sign in</a>
    </>
  )
}

ReactDOM.render(<App />, document.getElementById('app'))
