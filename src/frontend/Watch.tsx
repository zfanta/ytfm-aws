import React, { ReactElement, useEffect, useState } from 'react'
import { video } from './api'
import { useMediaQuery, useTheme } from '@material-ui/core'

interface WatchProps {
  videoId: string
}
function Watch ({ videoId }: WatchProps): ReactElement {
  const [iframe, setIframe] = useState<string>()
  const [iframeOriginal, setIframeOriginal] = useState<string>()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'))

  useEffect(() => {
    (async () => {
      try {
        const videoInformation = await video.get(videoId)
        setIframeOriginal(videoInformation.player.embedHtml)
      } catch (e) {
        setIframe(e.message)
        throw e
      }
    })().catch(console.error)
  }, [])

  useEffect(() => {
    if (iframeOriginal === undefined) return
    if (isMobile) {
      const doc = new DOMParser().parseFromString(iframeOriginal, 'text/html')
      const iframeElement = doc.querySelector('iframe')
      if (iframeElement === null) throw new Error('Failed to get player')
      const { width, height } = iframeElement
      const style = `position: absolute; left: 0; width: 100vw; height: ${100 * (parseInt(height) / parseInt(width))}vw`
      iframeElement.setAttribute('style', style)
      setIframe(`${iframeElement.outerHTML}<div style="width: 100vw; height: ${100 * (parseInt(height) / parseInt(width))}vw"></divs>`)
    } else {
      // TODO: optimize size
      setIframe(iframeOriginal)
    }
  }, [iframeOriginal, isMobile])

  if (iframe === undefined) {
    return <div>TODO: loading</div>
  }

  return (
    <div style={{ textAlign: 'center' }} dangerouslySetInnerHTML={{ __html: iframe }}>
    </div>
  )
}

export default Watch
