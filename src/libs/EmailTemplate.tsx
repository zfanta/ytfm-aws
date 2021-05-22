import 'source-map-support/register'

import React, { ReactElement } from 'react'
import ReactDOMServer from 'react-dom/server'
import { Helmet } from 'react-helmet'

function Head (): ReactElement {
  return (
    <Helmet>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no,viewport-fit=cover"/>
      <meta charSet="utf-8"/>
      <style type="text/css">{`
        * {
          font-family: arial, Arial, sans-serif;
        }

        #template { margin: 0 auto; width: 70%; max-width: 640px; }
        .thumbnail > a { position: relative; }
        .thumbnail img { width: 100%; }
        .duration {
          position: absolute;
          bottom: 0.5rem;
          right: 0.5rem;
          color: white;
          background-color: #212121;
          padding: 0.2rem 0.5rem;
          border-radius: 2px;
        }

        /* information */
        .information {
          display: flex;
          flex-direction: row;
          margin-top: 1rem;
        }
        .information .thumbnail {
          border-radius: 50%;
          width: 2.5rem;
          height: 2.5rem;
        }
        .title {
          display: flex;
          flex-direction: column;
          margin-left: 0.8rem;
        }
        .title .channel {
          margin-top: 0.2rem
        }
        .title a {
          text-decoration: none;
          color: black;
        }

        /* description */
        .description {
          margin-top: 1rem;
        }
        
        /* unsubscribe */
        .unsubscribe {
          margin-top: 1rem;
        }
        
        .debug {
          display: none;
        }
      `}</style>
    </Helmet>
  )
}

interface EmailTemplateProps {
  videoTitle: string
  videoLink: string
  thumbnail: string
  duration: string
  channelId: string
  channelTitle: string
  channelThumbnail: string
  description: string
  unsubscribeLink?: string
  debug?: string
}
function EmailTemplate (props: EmailTemplateProps): ReactElement {
  return (
    <>
      <Head/>

      <div className="thumbnail">
        <a href={props.videoLink}>
          <img src={props.thumbnail} alt={props.videoTitle}/>
          <div className="duration" dangerouslySetInnerHTML={{ __html: props.duration }}/>
        </a>
      </div>

      <div className="information">
        <a href={`https://youtube.com/channel/${props.channelId}`}>
          <img className="thumbnail" src={props.channelThumbnail} alt={props.channelTitle}/>
        </a>
        <div className="title">
          <a className="video" href={props.videoLink}>
            <span>{props.videoTitle}</span>
          </a>
          <a className="channel" href={`https://youtube.com/channel/${props.channelId}`}>
            <span>{props.channelTitle}</span>
          </a>
        </div>
      </div>

      <div className="description" dangerouslySetInnerHTML={{ __html: props.description }}/>

      {props.unsubscribeLink !== undefined &&
        <div className="unsubscribe">
          <a href={props.unsubscribeLink}>
            Unsubscribe channel notification
          </a>
        </div>
      }

      {props.debug !== undefined &&
        <div className="debug" style={{ display: 'none' }}>
          <pre dangerouslySetInnerHTML={{ __html: props.debug }}/>
        </div>
      }
    </>
  )
}

function renderToStaticMarkup (props: EmailTemplateProps): string {
  const body = ReactDOMServer.renderToStaticMarkup(<EmailTemplate {...props}/>)
  const helmet = Helmet.renderStatic()

  return `
  <html>
    <head>
      ${helmet.meta.toString()}
      ${helmet.style.toString()}
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
