import React, { ReactElement } from 'react'
import cookie from 'cookie'
import { Container } from '@material-ui/core'
import Subscriptions from './Subscriptions'

function App (): ReactElement {
  const SID: string|undefined = cookie.parse(document.cookie).SID

  return (
    <Container maxWidth="sm">
      {SID === undefined ? <div>TODO</div> : <Subscriptions />}
    </Container>
  )
}

export default App
