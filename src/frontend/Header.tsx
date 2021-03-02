import React, { ReactElement, useRef, useState, MouseEvent, KeyboardEvent } from 'react'
import { Box, Button, ClickAwayListener, Popper, Paper, Grow, MenuList, MenuItem } from '@material-ui/core'

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
    if (anchorRef?.current !== null && anchorRef.current.contains(event.target as HTMLElement)) {
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

interface HeaderProps {
  user: {
    email: string
  }|undefined
  signOut: () => Promise<void>
}
function Header ({ user, signOut }: HeaderProps): ReactElement {
  return (
    <Box style={{ textAlign: 'right' }}>
      {user === undefined ? null : <SignOutButton signOut={signOut} email={user.email} />}
    </Box>
  )
}

export default Header
