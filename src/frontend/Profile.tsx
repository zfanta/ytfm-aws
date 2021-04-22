import React, { Dispatch, ReactElement, SetStateAction, useState } from 'react'
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
import { clear } from './storage'
import { profile } from './api'
import type { ProfileGetResponse } from './api'

interface EmailNotificationProps {
  email: string
  notification: boolean
  callback: (result: ProfileGetResponse) => void
}
function EmailNotification ({ email, notification, callback }: EmailNotificationProps): ReactElement {
  const [patching, setPatching] = useState(false)

  async function updateNotification (): Promise<void> {
    setPatching(true)
    const result = await profile.patch(!notification)
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
    clear()
    setDeleting(true)
    await profile.delete()
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
  user: ProfileGetResponse
  setUser: Dispatch<SetStateAction<ProfileGetResponse | undefined>>
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
