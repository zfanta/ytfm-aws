import 'source-map-support/register'

import React, { ReactElement } from 'react'
import ReactDOMServer from 'react-dom/server'

interface EmailTemplateProps {
  videoTitle: string
  videoLink: string
  thumbnail: {
    width: number
    height: number
    url: string
  }
  duration: string
  channelId: string
  channelTitle: string
  channelThumbnail: string
  description: string
  unsubscribeLink: string
  debug: string
}
function EmailTemplate (props: EmailTemplateProps): ReactElement {
  const thumbnailHeight = 640 * (props.thumbnail.height / props.thumbnail.width)

  return (
    <div style={{
      fontFamily: 'arial, Arial, sans-serif',
      margin: '0 auto',
      width: '640px'
    }}>
      {/* video thumbnail */}
      <a href={props.videoLink}>
        <table cellPadding="0" cellSpacing="0" width="100%" style={{
          border: 0,
          backgroundImage: `url(${props.thumbnail.url})`,
          backgroundRepeat: 'no-repeat',
          backgroundSize: `640px ${thumbnailHeight}px`,
          width: '640px',
          height: `${thumbnailHeight}px`
        }}>
          <tr>
            <td valign="bottom" style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-block',
                color: 'white',
                backgroundColor: '#212121',
                marginBottom: '0.5rem',
                marginRight: '0.5rem',
                padding: '0.2rem 0.5rem'
              }} dangerouslySetInnerHTML={{ __html: props.duration }}/>
            </td>
          </tr>
        </table>
      </a>

      {/* titles */}
      <table cellPadding="0" cellSpacing="0" width="100%" style={{
        border: 0,
        width: '640px',
        marginTop: '1rem'
      }}>
        <tr>
          <td rowSpan={3} width="50px">
            <a href={`https://youtube.com/channel/${props.channelId}`}>
              <img src={props.channelThumbnail} alt={props.channelTitle} style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%'
              }}/>
            </a>
          </td>
        </tr>
        <tr>
          <td>
            <a href={props.videoLink} style={{ textDecoration: 'none', color: 'black' }}>
              {props.videoTitle}
            </a>
          </td>
        </tr>
        <tr>
          <td>
            <a href={`https://youtube.com/channel/${props.channelId}`} style={{ textDecoration: 'none', color: 'black' }}>
              {props.channelTitle}
            </a>
          </td>
        </tr>
      </table>

      <div dangerouslySetInnerHTML={{ __html: props.description }} style={{ marginTop: '1rem' }}/>

      {props.unsubscribeLink !== undefined &&
        <div style={{ margin: '1rem 0' }}>
          <a href={props.unsubscribeLink}>Unsubscribe channel notification</a>
        </div>
      }

      {props.debug !== undefined &&
        <div style={{ display: 'none' }} >
          <pre dangerouslySetInnerHTML={{ __html: props.debug }}/>
        </div>
      }
    </div>
  )
}

function renderToStaticMarkup (props: EmailTemplateProps): string {
  const body = ReactDOMServer.renderToStaticMarkup(<EmailTemplate {...props}/>)

  return `
  <html lang="en">
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no,viewport-fit=cover"/>
      <meta charSet="utf-8"/>
      <title>${props.videoTitle}</title>
    </head>
    <body id="template">
      ${body}
    </body>
  </html>
  `
}

export {
  renderToStaticMarkup
}
export default EmailTemplate
