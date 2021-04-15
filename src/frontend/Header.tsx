import React, { ReactElement, useRef, useState, MouseEvent, KeyboardEvent, Dispatch, SetStateAction } from 'react'
import {
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
  DialogContentText,
  Avatar,
  AppBar,
  Typography,
  useScrollTrigger,
  Slide,
  Container,
  Toolbar
} from '@material-ui/core'
import cookie from 'cookie'
import qs from 'query-string'
import { useLocation } from 'wouter'
import { clear } from './storage'

function HideOnScroll ({ children }): ReactElement {
  const trigger = useScrollTrigger()

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  )
}

interface SignOutButtonProps {
  email: string
  photo: string
  signOut: () => Promise<void>
}
function ButtonsAfterSignIn ({ email, photo, signOut }: SignOutButtonProps): ReactElement {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [location, setLocation] = useLocation()

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
    clear()
  }

  function handleListKeyDown (event: KeyboardEvent): void {
    if (event.key === 'Tab') {
      event.preventDefault()
      setOpen(false)
    }
  }

  return (
    <>
      <Button
        ref={anchorRef}
        aria-controls={open ? 'menu-list-grow' : undefined}
        aria-haspopup="true"
        onClick={handleToggle}
        style={{ padding: 0, minWidth: '40px' }}
      >
        <Avatar alt={email} src={photo} />
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
                  {location === '/'
                    ? <MenuItem onClick={e => { handleClose(e); setLocation('/profile') }}>Profile</MenuItem>
                    : <MenuItem onClick={e => { handleClose(e); setLocation('/') }}>Subscriptions</MenuItem>
                  }
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </>
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

  function makeQuery (): string {
    const SID = cookie.parse(document.cookie).SID as string

    return qs.stringify({
      client_id: '969455847018-a7agkq11k0p97jumrronqnrtctfu45pp.apps.googleusercontent.com',
      // TODO: replace dev to variable
      redirect_uri: 'https://dev.ytfm.app/api/oauth2',
      state: `SID=${SID}`,
      response_type: 'code',
      scope: 'email https://www.googleapis.com/auth/youtube.readonly profile',
      approval_prompt: 'auto',
      access_type: 'offline'
    })
  }

  return (
    <Button
      variant="outlined"
      onClick={() => { window.location.href = `https://accounts.google.com/o/oauth2/auth?${makeQuery()}` }}
    >
      Sign in
    </Button>
  )
}

interface HeaderProps {
  user: User|undefined
  signOut: () => Promise<void>
}
function Header ({ user, signOut }: HeaderProps): ReactElement {
  return (
    <>
      <HideOnScroll>
        <AppBar color="transparent" style={{ backgroundColor: 'white' }}>
          <Container maxWidth="sm" style={{ padding: 0 }}>
            <Toolbar>
              <Typography variant="h6" style={{ flexGrow: 1 }}>YTFM</Typography>
              {user === undefined
                ? <SignInButton />
                : <ButtonsAfterSignIn signOut={signOut} email={user.email} photo={user.photos[0]} />
              }
          </Toolbar>
          </Container>
        </AppBar>
      </HideOnScroll>
      <Toolbar style={{ marginBottom: '1rem' }} />
    </>
  )
}

export default Header

export interface User {
  email: string
  photos: string[]
  notification: boolean
  updatedAt: number
}
