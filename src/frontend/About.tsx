import React, { ReactElement } from 'react'
import { Link } from 'wouter'
import { RefreshSharp } from '@material-ui/icons'

function Policy (): ReactElement {
  return (
    <>
      <h1>What does it do?</h1>

      <p>
        YouTube has stopped sending email notifications for new video uploads from your YouTube channel subscriptions.<br/>
        See also:&nbsp;
        <a href="https://support.google.com/youtube/thread/63269933/changes-to-emails-you-receive-for-new-video-uploads-from-your-subscriptions">
          Changes to emails you receive for new video uploads from your subscriptions
        </a>
      </p>
      <p>
        YTFM sends email notification for new video uploads from your YouTube channel subscriptions.
      </p>

      <h1>Who's going to use it?</h1>

      <p>
        Everyone who has YouTube account and is missing YouTube email notification feature.
      </p>

      <h1>How does it work?</h1>

      <ol>
        <li>Sign in YTFM using google account</li>
        <p>
          You should allow all permissions YTFM requires. <Link href="/policy">Click to see permissions and data we
          requires.</Link><br/>
          At this step, YTFM collects your google email address and google profile photos.
        </p>
        <li>Sync your YouTube channel subscriptions</li>
        <p>
          After you sign in, you will be located in <Link href="/subscriptions">subscriptions page</Link> and click the
          sync button <RefreshSharp fontSize="small" style={{ verticalAlign: 'middle' }}/> upper right in screen.
          Everytime you change your subscription click the sync button<br/>
          At this step, YTFM collects your YouTube channel subscription list.
        </p>
        <li>YTFM subscribes PubSubHubbub</li>
        <p>
          After you sync your subscriptions.
          YTFM uses <Link href="https://developers.google.com/youtube/v3/guides/push_notifications">PubSubHubbub protocol</Link>
          &nbsp;to subscribe all channels you have added. It takes few minutes to subscribe all channels you have added.
        </p>
        <li>Wait for email notifications</li>
        <p>
          When a channel you are subscribing uploads a video, email notification will be sent to your email address.
        </p>
      </ol>

      <h1>Contact</h1>

      <p>
        If you have any problem and question, send an email to:<br/>
        <a href="mailto:ytfm.app@gmail.com">ytfm.app@gmail.com</a>
      </p>
    </>
  )
}

export default Policy
