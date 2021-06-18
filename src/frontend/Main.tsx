import React, { ReactElement } from 'react'
import { useLocation } from 'wouter'
import { useRecoilValue } from 'recoil'
import { userState } from './recoil'
import logo from './logo.png'

function Main (): ReactElement {
  const user = useRecoilValue(userState)
  const [, setLocation] = useLocation()

  if (user !== null && user !== undefined) {
    setLocation('/subscriptions')
    return <></>
  }

  function handleClickSignInButton (): void {
    const element = document.getElementById('sign-in')
    if (element !== null) {
      element.click()
    }
  }

  return (
    <>
      <p>
        YTFM sends you an email notification for new video uploads from your subscriptions.
        YTFM supports this via <a href="https://developers.goog`le.com/youtube/v3/guides/push_notifications">PubSubHubbub</a>.<br/>
        If you want to be notified from YTFM, click <a style={{ cursor: 'pointer' }} onClick={handleClickSignInButton}>SIGN IN</a> button.
        <img src={logo} alt="YTFM"/>
      </p>
      <p>
        See also:<br/>
        <a href="https://support.google.com/youtube/thread/63269933/changes-to-emails-you-receive-for-new-video-uploads-from-your-subscriptions">
          Changes to emails you receive for new video uploads from your subscriptions
        </a>
      </p>
    </>
  )
}

export default Main
