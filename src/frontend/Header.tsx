import React, { ReactElement, useRef, useState, MouseEvent, KeyboardEvent } from 'react'
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
import { useLocation, Link } from 'wouter'
import { clear } from './storage'
import { cookie as cookieApi } from './api'
import type { ProfileGetResponse } from './api'
import Policy from './Policy'

function HideOnScroll ({ children }): ReactElement {
  const trigger = useScrollTrigger()

  return (
    <Slide appear={false} direction="down" in={!trigger}>
      {children}
    </Slide>
  )
}

function makeOauth2Link (): string {
  const SID = cookie.parse(document.cookie).SID as string

  const redirectUri = `${window.location.origin}/api/oauth2`
  const query = qs.stringify({
    client_id: '969455847018-a7agkq11k0p97jumrronqnrtctfu45pp.apps.googleusercontent.com',
    // TODO: replace dev to variable
    redirect_uri: redirectUri,
    state: `SID=${SID}&REDIRECT_URI=${redirectUri}`,
    response_type: 'code',
    scope: 'email https://www.googleapis.com/auth/youtube.readonly profile',
    approval_prompt: 'auto',
    access_type: 'offline'
  })

  return `https://accounts.google.com/o/oauth2/auth?${query}`
}

interface SignOutButtonProps {
  email: string
  photo: string
  signOut: () => Promise<void>
}
function ButtonsAfterSignIn ({ email, photo, signOut }: SignOutButtonProps): ReactElement {
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLButtonElement>(null)
  const [location] = useLocation()

  function handleToggle (): void {
    setOpen((pervOpen) => !pervOpen)
  }

  function handleClose (event: MouseEvent<EventTarget>): void {
    if (anchorRef?.current !== null && anchorRef.current.contains(event.target as HTMLElement)) {
      return
    }
    setOpen(false)
  }

  function handleSignOut (): void {
    signOut().catch(console.error)
    clear(['user', 'subscriptions'])
  }

  function handleSwitchAccount (): void {
    signOut().catch(console.error)
    clear(['user'])
    window.location.href = makeOauth2Link()
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
                  <MenuItem onClick={e => { handleClose(e); handleSwitchAccount() }}>Switch account</MenuItem>
                  {location.startsWith('/subscriptions')
                    ? <MenuItem onClick={e => { handleClose(e) }}>
                        <Link href="/profile">Profile</Link>
                      </MenuItem>
                    : <MenuItem onClick={e => { handleClose(e) }}>
                        <Link href="/subscriptions">Subscriptions</Link>
                      </MenuItem>
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

function SignInButton (): ReactElement {
  const [cookieAccepted, setCookieAccepted] = useState(cookie.parse(document.cookie).SID !== undefined)
  const [open, setOpen] = useState(false)

  async function signIn (): Promise<void> {
    if (!cookieAccepted) {
      await cookieApi.get()
    }
    setCookieAccepted(true)
    setOpen(false)
    window.location.href = makeOauth2Link()
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
        <DialogTitle id="alert-dialog-title">Sign in policy</DialogTitle>
        <DialogContent>
          <div
            id="alert-dialog-description"
            className="MuiTypography-root MuiDialogContentText-root MuiTypography-body1 MuiTypography-colorTextSecondary"
          >
            <Policy />
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)} autoFocus>Decline</Button>
          <Button onClick={signIn}>Accept</Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

interface HeaderProps {
  user: ProfileGetResponse|undefined|null
  signOut: () => Promise<void>
}
function Header ({ user, signOut }: HeaderProps): ReactElement {
  const [location] = useLocation()

  return (
    <>
      <HideOnScroll>
        <AppBar color="transparent" style={{ backgroundColor: 'white' }}>
          <Container maxWidth="sm" style={{ padding: 0 }}>
            <Toolbar>
              <Typography variant="h6" style={{ flexGrow: 1 }}>
                <Link href={user !== undefined ? '/subscriptions' : '/'}>YTFM</Link>
              </Typography>
              {location.startsWith('/unsubscribe')
                ? null
                : user === undefined || user === null
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
