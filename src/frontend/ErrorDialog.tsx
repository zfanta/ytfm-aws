import React, { ReactElement } from 'react'
import { Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@material-ui/core'
import { useRecoilState } from 'recoil'
import { errorState } from './recoil'

function ErrorDialog (): ReactElement {
  const [error, setError] = useRecoilState(errorState)

  return (
    <Dialog
      open={error !== ''}
      onClose={() => setError('')}
      aria-labelledby="alert-dialog-title"
      aria-describedby="alert-dialog-description"
    >
      <DialogTitle id="alert-dialog-title">Error</DialogTitle>
      <DialogContent>
        <div
          id="alert-dialog-description"
          className="MuiTypography-root MuiDialogContentText-root MuiTypography-body1 MuiTypography-colorTextSecondary"
        >
          {error}
        </div>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setError('')} autoFocus>Close</Button>
      </DialogActions>
    </Dialog>
  )
}

export default ErrorDialog
