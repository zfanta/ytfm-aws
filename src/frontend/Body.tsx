import React, { ReactElement, Suspense } from 'react'
import { Route, Switch } from 'wouter'
const Subscriptions = React.lazy(async () => await import('./Subscriptions'))
const Profile = React.lazy(async () => await import('./Profile'))
const Policy = React.lazy(async () => await import('./Policy'))
const Watch = React.lazy(async () => await import('./Watch'))
const Main = React.lazy(async () => await import('./Main'))
const Tools = React.lazy(async () => await import('./Tools'))

function Body (): ReactElement {
  return (
    <Switch>
      <Route path="/">
        <Suspense fallback={<div>TODO: loading</div>}>
          <Main />
        </Suspense>
      </Route>
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
          <Profile/>
        </Suspense>
      </Route>
      <Route path="/policy">
        <Suspense fallback={<div>TODO: loading</div>}>
          <Policy />
        </Suspense>
      </Route>
      <Route path="/watch/:videoId">
        {params =>
          <Suspense fallback={<div>TODO: loading</div>}>
            <Watch videoId={params.videoId} />
          </Suspense>
        }
      </Route>
      <Route path="/tools">
        <Suspense fallback={<div>TODO: loading</div>}>
          <Tools />
        </Suspense>
      </Route>
    </Switch>
  )
}

export default Body
