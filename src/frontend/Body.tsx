import React, { ReactElement, ReactNode, Suspense } from 'react'
import { Route, Switch } from 'wouter'
import Loading from './Loading'
const Subscriptions = React.lazy(async () => await import('./Subscriptions'))
const Profile = React.lazy(async () => await import('./Profile'))
const Policy = React.lazy(async () => await import('./Policy'))
const Watch = React.lazy(async () => await import('./Watch'))
const Main = React.lazy(async () => await import('./Main'))
const Tools = React.lazy(async () => await import('./Tools'))
const About = React.lazy(async () => await import('./About'))

function SuspenseWithLoading ({ children }: {children: ReactNode}): ReactElement {
  return (
    <Suspense fallback={<Loading/>}>
      {children}
    </Suspense>
  )
}

function Body (): ReactElement {
  return (
    <Switch>
      <Route path="/">
        <SuspenseWithLoading>
          <Main />
        </SuspenseWithLoading>
      </Route>
      <Route path="/subscriptions">
        <SuspenseWithLoading>
          <Subscriptions />
        </SuspenseWithLoading>
      </Route>
      <Route path="/subscriptions/:channelId">
        {params => (
          <SuspenseWithLoading>
            <Subscriptions channelId={params.channelId} />
          </SuspenseWithLoading>
        )}
      </Route>
      <Route path="/profile">
        <SuspenseWithLoading>
          <Profile/>
        </SuspenseWithLoading>
      </Route>
      <Route path="/policy">
        <SuspenseWithLoading>
          <Policy />
        </SuspenseWithLoading>
      </Route>
      <Route path="/about">
        <SuspenseWithLoading>
          <About />
        </SuspenseWithLoading>
      </Route>
      <Route path="/watch/:videoId">
        {params =>
          <SuspenseWithLoading>
            <Watch videoId={params.videoId} />
          </SuspenseWithLoading>
        }
      </Route>
      <Route path="/tools">
        <SuspenseWithLoading>
          <Tools />
        </SuspenseWithLoading>
      </Route>
    </Switch>
  )
}

export default Body
