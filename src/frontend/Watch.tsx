import React, { CSSProperties, ReactElement, useEffect, useState } from 'react'
import { video } from './api'
import { useMediaQuery, useTheme } from '@material-ui/core'

interface WatchProps {
  videoId: string
}
function Watch ({ videoId }: WatchProps): ReactElement {
  const [embedHtml, setEmbedHtml] = useState<string>()
  const [style, setStyle] = useState<CSSProperties>()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // 960

  useEffect(() => {
    (async () => {
      // TODO: error
      const videoInformation = await video.get(videoId)
      setEmbedHtml(videoInformation.player.embedHtml)
    })().catch(console.error)
  }, [])

  useEffect(() => {
    if (embedHtml === undefined) return

    const doc = new DOMParser().parseFromString(embedHtml, 'text/html')
    const iframeElement = doc.querySelector('iframe')
    if (iframeElement === null) throw new Error('Failed to get player')
    const width = parseInt(iframeElement.width)
    const height = parseInt(iframeElement.height)

    if (isMobile) {
      setStyle({
        position: 'absolute',
        left: '0',
        width: '100vw',
        height: `${100 * (height / width)}vw`
      })
    } else {
      setStyle({
        position: 'absolute',
        left: '50%',
        marginLeft: 'calc(-1 * (var(--video-width) / 2))',
        height: 'var(--video-height)',
        width: 'var(--video-width)',
        // @ts-expect-error
        '--video-width': 'max(calc(100vw * (2/3)), 960px)',
        '--video-height': `calc(var(--video-width) * (${height}/${width}))`
      })
    }
  }, [embedHtml, isMobile])

  if (style === undefined) {
    return <div>TODO: loading</div>
  }

  return (
    <div>
      <iframe
        style={style}
        src={`https://www.youtube.com/embed/${videoId}`}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
      <div style={{
        height: style?.height,
        minHeight: style.minHeight,
        // @ts-expect-error
        '--video-width': 'max(calc(100vw * (2/3)), 960px)',
        '--video-height': style['--video-height']
      }}/>
    </div>
  )
}

export default Watch