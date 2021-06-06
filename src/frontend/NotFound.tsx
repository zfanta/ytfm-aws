import React, { ReactElement, useEffect, useState } from 'react'
import { useLocation } from 'wouter'

function NotFound (): ReactElement {
  const [timer, setTimer] = useState(5)
  const [, setLocation] = useLocation()

  useEffect(() => {
    setTimeout(() => {
      setTimer(timer - 1)
    }, 1000)
    if (timer <= 0) {
      setLocation('/')
    }
  }, [timer])

  return (
    <>
      Sorry, this page could not be found.<br/>
      You will be redirected to main page in {timer} second{ timer === 1 ? '' : 's'}.
    </>
  )
}

export default NotFound
