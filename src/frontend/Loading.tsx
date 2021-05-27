import React, { ReactElement } from 'react'
import { CircularProgress, Grid } from '@material-ui/core'

function Loading (): ReactElement {
  return (
    <Grid container>
      <Grid item xs={12} style={{ textAlign: 'center' }}>
        <CircularProgress size="1rem" />
      </Grid>
    </Grid>
  )
}

export default Loading
