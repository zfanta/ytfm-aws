import React, { CSSProperties, ReactElement, useEffect, useState } from 'react'
import { video } from './api'
import { useMediaQuery, useTheme } from '@material-ui/core'
import { useSetRecoilState } from 'recoil'
import { Helmet } from 'react-helmet'
import { errorState } from './recoil'
import Loading from './Loading'
import type { VideoFromGoogleApis } from './api'

function getThumbnail (information: VideoFromGoogleApis): string {
  const { thumbnails } = information.snippet
  const thumbnailKey = Object.keys(thumbnails).reduce((prev, current) => {
    if (thumbnails[prev].width < thumbnails[current].width) {
      return current
    }
    return prev
  })
  return thumbnails[thumbnailKey].url
}

interface WatchProps {
  videoId: string
}
function Watch ({ videoId }: WatchProps): ReactElement {
  const [information, setInformation] = useState<VideoFromGoogleApis>()
  const [width, setWidth] = useState<number>(0)
  const [height, setHeight] = useState<number>(0)
  const [style, setStyle] = useState<CSSProperties>()
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down('sm')) // 960
  const setError = useSetRecoilState(errorState)

  useEffect(() => {
    video.get(videoId)
      .then(videoInformation => {
        setInformation(videoInformation)
      })
      .catch(e => setError(e.toString()))
  }, [])

  useEffect(() => {
    if (information?.player.embedHtml === undefined) return

    const doc = new DOMParser().parseFromString(information.player.embedHtml, 'text/html')
    const iframeElement = doc.querySelector('iframe')
    if (iframeElement === null) throw new Error('Failed to get player')
    const width = parseInt(iframeElement.width)
    const height = parseInt(iframeElement.height)
    setWidth(width)
    setHeight(height)

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
  }, [information, isMobile])

  if (style === undefined || information === undefined) {
    return <Loading/>
  }

  document.title = information?.snippet.title ?? 'YTFM'

  return (
    <div>
      <Helmet>
        <meta name="og:url" content={`https://www.ytfm.app/watch/${videoId}`}/>
        <meta name="og:title" content={information.snippet.title ?? 'YTFM'}/>
        <meta name="og:description" content={information.snippet.description ?? 'YTFM'}/>
        <meta name="og:image" content={getThumbnail(information)}/>
        <meta name="og:video" content={`https://www.ytfm.app/watch/${videoId}`}/>
        <meta name="og:video:url" content={`https://www.ytfm.app/watch/${videoId}`}/>
        <meta name="og:video:width" content={`${width}`}/>
        <meta name="og:video:height" content={`${height}`}/>
      </Helmet>
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
