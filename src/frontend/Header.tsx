import React, { ReactElement, useRef, useState, MouseEvent, KeyboardEvent, Dispatch, SetStateAction } from 'react'
import {
  Box,
  Button,
  ClickAwayListener,
  Popper,
  Paper,
  Grow,
  MenuList,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  DialogContentText
} from '@material-ui/core'
import cookie from 'cookie'
import qs from 'query-string'

interface SignOutButtonProps {
  email: string
  signOut: () => Promise<void>
}
function SignOutButton ({ email, signOut }: SignOutButtonProps): ReactElement {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)

  function handleToggle (): void {
    setOpen((pervOpen) => !pervOpen)
  }

  function handleClose (event: MouseEvent<EventTarget>): void {
    // TODO: parcel2 error: @parcel/optimizer-terser: Unexpected token: punc (.)
    // if (anchorRef?.current !== null && anchorRef.current.contains(event.target as HTMLElement)) {
    if (anchorRef !== null && anchorRef.current !== null && anchorRef.current.contains(event.target as HTMLElement)) {
      return
    }
    setOpen(false)
  }

  function handleSignOut (): void {
    signOut().catch(console.error)
  }

  function handleListKeyDown (event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <Box>
      <Button
        ref={anchorRef}
        aria-controls={open ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
      >
        {email}
      </Button>
      <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal>
        {({ TransitionProps, placement }) => (
          <Grow
            {...TransitionProps}
            style={{ transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom' }}
          >
            <Paper>
              <ClickAwayListener onClickAway={handleClose}>
                <MenuList autoFocusItem={open} id="menu-list-grow" onKeyDown={handleListKeyDown}>
                  <MenuItem onClick={e => { handleClose(e); handleSignOut() }}>Sign out</MenuItem>
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </Box>
  )
}

function CookieAcceptButton ({ setCookieAccepted }: {setCookieAccepted: Dispatch<SetStateAction<boolean>>}): ReactElement {
  const [open, setOpen] = useState(false)

  async function getCookie (): Promise<void> {
    await fetch('/api/cookie', { mode: 'cors' })
    setCookieAccepted(true)
    setOpen(false)
  }

  return (
    <>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Sign in
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
            TODO: cookie
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} autoFocus>Decline</Button>
          <Button onClick={getCookie}>Accept</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

function SignInButton (): ReactElement {
  const [cookieAccepted, setCookieAccepted] = useState(cookie.parse(document.cookie).SID !== undefined)

  if (!cookieAccepted) return <CookieAcceptButton setCookieAccepted={setCookieAccepted} />

  const SID = cookie.parse(document.cookie).SID as string

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
    <Button
      variant="outlined"
      onClick={() => { window.location.href = `https://accounts.google.com/o/oauth2/auth?${query}` }}
    >
      Sign in
    </Button>
  )
}

interface HeaderProps {
  user: {
    email: string
  }|undefined
  signOut: () => Promise<void>
}
function Header ({ user, signOut }: HeaderProps): ReactElement {
  return (
    <Box style={{ textAlign: 'right' }}>
      {user === undefined ? <SignInButton /> : <SignOutButton signOut={signOut} email={user.email} />}
    </Box>
  )
}

export default Header
