import React, { ReactElement } from 'react'
import { useLocation } from 'wouter'
import { useRecoilValue } from 'recoil'
import { userState } from './recoil'

function Main (): ReactElement {
  const user = useRecoilValue(userState)
  const [, setLocation] = useLocation()

  if (user !== null) {
    setLocation('/subscriptions')
    return <></>
  }

  return <div>TODO: main</div>
}

export default Main
