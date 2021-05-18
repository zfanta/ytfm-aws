import React, { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react'
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Grid, NativeSelect
} from '@material-ui/core'
import { NotificationsOffSharp, NotificationsActiveSharp } from '@material-ui/icons'
import { useLocation } from 'wouter'
import { clear } from './storage'
import { profile, regions as regionsApi } from './api'
import type { Region as RegionType, ProfileGetResponse } from './api'

interface EmailNotificationProps {
  email: string
  notification: boolean
  callback: (result: ProfileGetResponse) => void
}
function EmailNotification ({ email, notification, callback }: EmailNotificationProps): ReactElement {
  const [patching, setPatching] = useState(false)

  async function updateNotification (): Promise<void> {
    setPatching(true)
    const result = await profile.patch({
      notification: !notification
    })
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
    clear(['user', 'subscriptions'])
    setDeleting(true)
    await profile.delete()
    setDeleting(false)
    callback(undefined)
    setLocation('/')
  }

  return (
    <Grid item xs={12}>
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
    </Grid>
  )
}

interface RegionProps {
  region: string|undefined
  regions: RegionType[]
  callback: (result: ProfileGetResponse) => void
}
function Region ({ region, regions, callback }: RegionProps): ReactElement {
  const [regionValue, setRegionValue] = useState(region)

  function handleChange ({ target: { value } }: React.ChangeEvent<{value: string}>): void {
    setRegionValue(value)
    profile.patch({ region: value }).then(callback).catch(console.error)
  }

  const deviceRegion = regions.find(region => region.id === navigator.language.split('-')[1])?.id ?? 'US'

  return (
    <>
      <Grid item xs={2}>
        Region
      </Grid>
      <Grid item xs={10}>
        <NativeSelect
          value={regionValue}
          onChange={handleChange}
        >
          <option value={undefined}>None</option>
          {regions.filter(region => region.id === deviceRegion).map(region => <option value={region.id} key={region.id}>{region.name}</option>)}
          {regions.filter(region => region.id !== deviceRegion).map(region => <option value={region.id} key={region.id}>{region.name}</option>)}
        </NativeSelect>
      </Grid>
    </>
  )
}

interface ProfileProps {
  user: ProfileGetResponse
  setUser: Dispatch<SetStateAction<ProfileGetResponse | undefined>>
}
function Profile ({ user, setUser }: ProfileProps): ReactElement {
  const [regions, setRegions] = useState<RegionType[]>()

  useEffect(() => {
    (async () => {
      const regions = await regionsApi.get(navigator.language)
      setRegions(regions)
    })().catch(console.error)
  }, [])

  if (regions === undefined) {
    return <div>TODO: loading</div>
  }

  return (
    <Grid container spacing={3} alignItems="center">
      <EmailNotification
        email={user.email}
        notification={user.notification}
        callback={setUser}
      />
      <Region region={user.region} regions={regions} callback={setUser} />
      <DeleteAccount callback={setUser} />
    </Grid>
  )
}

export default Profile
