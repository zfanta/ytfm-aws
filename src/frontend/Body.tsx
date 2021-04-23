import { Route, Switch } from 'wouter'
import Subscriptions from './Subscriptions'
import Profile from './Profile'
import React, { Dispatch, ReactElement, SetStateAction } from 'react'
import { ProfileGetResponse } from './api'

interface BodyProps {
  user: ProfileGetResponse|undefined
  setUser: Dispatch<SetStateAction<ProfileGetResponse | undefined>>
}
function Body ({ user, setUser }: BodyProps): ReactElement {
  if (user === undefined) {
    return <div>TODO: main</div>
  }

  return (
    <Switch>
      <Route path="/subscriptions">
        <Subscriptions />
      </Route>
      <Route path="/subscriptions/:channelId">
        {params => <Subscriptions channelId={params.channelId} />}
      </Route>
      <Route path="/profile">
        <Profile user={user} setUser={setUser} />
      </Route>
    </Switch>
  )
}

export default Body
