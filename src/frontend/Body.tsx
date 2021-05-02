import React, { Dispatch, ReactElement, SetStateAction, Suspense } from 'react'
import { Route, Switch, useLocation } from 'wouter'
import { ProfileGetResponse } from './api'
const Subscriptions = React.lazy(async () => await import('./Subscriptions'))
const Profile = React.lazy(async () => await import('./Profile'))
const Policy = React.lazy(async () => await import('./Policy'))

interface BodyProps {
  user: ProfileGetResponse|undefined
  setUser: Dispatch<SetStateAction<ProfileGetResponse | undefined>>
}
function Body ({ user, setUser }: BodyProps): ReactElement {
  const [location] = useLocation()

  if (user === undefined && location !== '/policy') {
    return <div>TODO: main</div>
  }

  return (
    <Switch>
      <Route path="/subscriptions">
        <Suspense fallback={<div>TODO: loading</div>}>
          <Subscriptions />
        </Suspense>
      </Route>
      <Route path="/subscriptions/:channelId">
        {params => (
          <Suspense fallback={<div>TODO: loading</div>}>
            <Subscriptions channelId={params.channelId} />
          </Suspense>
        )}
      </Route>
      <Route path="/profile">
        <Suspense fallback={<div>TODO: loading</div>}>
          <Profile user={user as ProfileGetResponse} setUser={setUser} />
        </Suspense>
      </Route>
      <Route path="/policy">
        <Suspense fallback={<div>TODO: loading</div>}>
          <Policy />
        </Suspense>
      </Route>
    </Switch>
  )
}

export default Body