import React, { CSSProperties, ReactElement, useEffect, useState } from 'react'
import { video } from './api'
import { useMediaQuery, useTheme } from '@material-ui/core'
import { useSetRecoilState } from 'recoil'
import { errorState } from './recoil'
import Loading from './Loading'

interface WatchProps {
  videoId: string
}
function Watch ({ videoId }: WatchProps): ReactElement {
  const [embedHtml, setEmbedHtml] = useState<string>()
  const [title, setTitle] = useState<string>()
  const [style, setStyle] = useState<CSSProperties>()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // 960
  const setError = useSetRecoilState(errorState)

  useEffect(() => {
    video.get(videoId)
      .then(videoInformation => {
        setEmbedHtml(videoInformation.player.embedHtml)
        setTitle(videoInformation.snippet.title)
      })
      .catch(e => setError(e.toString()))
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
        '--video-height': `min(calc(var(--video-width) * (${height}/${width})), 80vh)`
      })
    }
  }, [embedHtml, isMobile])

  if (style === undefined) {
    return <Loading/>
  }

  if (title !== undefined) {
    document.title = title
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
        '--video-width': style['--video-width'],
        '--video-height': style['--video-height']
      }}/>
    </div>
  )
}

export default Watch
