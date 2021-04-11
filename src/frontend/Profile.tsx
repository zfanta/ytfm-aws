import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react'
import { User } from './Header'
import {CircularProgress, Grid} from '@material-ui/core'
import { NotificationsOffSharp, NotificationsActiveSharp } from '@material-ui/icons'

interface EmailNotificationProps {
  email: string
  notification: boolean
  updateNotification: () => Promise<void>
  patching: boolean
}
function EmailNotification ({ email, notification, updateNotification, patching }: EmailNotificationProps): ReactElement {
  return (
    <>
      <Grid item xs={2}>
        Email
      </Grid>
      <Grid item xs={8}>
        {email}
      </Grid>
      <Grid item xs={2} onClick={updateNotification}>
        {patching
          ? <CircularProgress size="1rem" />
          : notification ? <NotificationsActiveSharp /> : <NotificationsOffSharp />
        }
      </Grid>
    </>
  )
}

interface ProfileProps {
  user: User
  setUser: Dispatch<SetStateAction<User | undefined>>
}
function Profile ({ user, setUser }: ProfileProps): ReactElement {
  const [patching, setPatching] = useState(false)

  async function updateNotification (): Promise<void> {
    setPatching(true)
    const result = await (await fetch('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ notification: !user.notification }),
      headers: {
        'Content-Type': 'application/json'
      }
    })).json()
    setUser(result)
    setPatching(false)
  }

  return (
    <Grid container spacing={3} alignItems="center">
      <EmailNotification
        email={user.email}
        notification={user.notification}
        updateNotification={updateNotification}
        patching={patching}
      />
    </Grid>
  )
}

export default Profile
