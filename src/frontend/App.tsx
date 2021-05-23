import React, { ReactElement, useEffect, useState, Suspense } from 'react'
import { Container, Divider } from '@material-ui/core'
import { useLocation } from 'wouter'
import Header from './Header'
import Body from './Body'
import Footer from './Footer'
const SwaggerUI = React.lazy(async () => await import('./SwaggerUI'))

function App (): ReactElement {
  const [location] = useLocation()
  const [swagger, setSwagger] = useState(false)

  useEffect(() => {
    if (location === '/swagger') {
      setSwagger(true)
    }
  }, [])

  if (swagger) {
    return (
      <Suspense fallback={<div>Loading Swagger UI</div>}>
        <SwaggerUI />
      </Suspense>
    )
  }

  return (
    <Container maxWidth={location.startsWith('/tools') ? false : 'sm'}>
      <Header/>
      <Body/>
      <Divider style={{ marginTop: '1rem', marginBottom: '1rem' }}/>
      <Footer/>
    </Container>
  )
}

export default App
