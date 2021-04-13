import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react'
import { User } from './Header'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid
} from '@material-ui/core'
import { NotificationsOffSharp, NotificationsActiveSharp } from '@material-ui/icons'
import { useLocation } from 'wouter'

interface EmailNotificationProps {
  email: string
  notification: boolean
  callback: (result: User) => void
}
function EmailNotification ({ email, notification, callback }: EmailNotificationProps): ReactElement {
  const [patching, setPatching] = useState(false)

  async function updateNotification (): Promise<void> {
    setPatching(true)
    const result = await (await fetch('/api/profile', {
      method: 'PATCH',
      body: JSON.stringify({ notification: !notification }),
      headers: {
        'Content-Type': 'application/json'
      }
    })).json()
    callback(result)
    setPatching(false)
  }

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

interface DeleteAccountProps {
  callback: (result: undefined) => void
}
function DeleteAccount ({ callback }: DeleteAccountProps): ReactElement {
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [, setLocation] = useLocation()

  async function deleteAccount (): Promise<void> {
    setDeleting(true)
    await fetch('/api/profile', { method: 'DELETE' })
    setDeleting(false)
    callback(undefined)
    setLocation('/')
  }

  return (
    <>
      <Button
        variant="outlined"
        color="secondary"
        onClick={() => { setOpen(true) }}
        fullWidth={true}
      >
        Delete account
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">TODO: cookie</DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            TODO: asd
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} autoFocus>Cancel</Button>
          <Button onClick={async () => await deleteAccount()}>
            {deleting ? <CircularProgress size="1rem" /> : 'Delete account'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

interface ProfileProps {
  user: User
  setUser: Dispatch<SetStateAction<User | undefined>>
}
function Profile ({ user, setUser }: ProfileProps): ReactElement {
  return (
    <Grid container spacing={3} alignItems="center">
      <EmailNotification
        email={user.email}
        notification={user.notification}
        callback={setUser}
      />
      <DeleteAccount callback={setUser} />
    </Grid>
  )
}

export default Profile