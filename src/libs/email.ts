import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2'
import { parse } from 'iso8601-duration'
import { VideoFromGoogleApis } from '@libs/types'
import MailComposer from 'nodemailer/lib/mail-composer'
import { generateUnsubscribeToken } from '@libs/crypto'

// TODO: region name
const client = new SESv2Client({ region: 'us-east-1' })

function getDuration (video: VideoFromGoogleApis): string {
  const { liveBroadcastContent } = video.snippet
  if (liveBroadcastContent === 'live') {
    return 'LIVE'
  }
  if (liveBroadcastContent === 'upcoming') {
    return 'PREMIERE'
  }

  // https://en.wikipedia.org/wiki/ISO_8601#Durations
  let duration: string
  let { hours, minutes, seconds } = parse(video.contentDetails.duration)
  hours ??= 0
  minutes ??= 0
  seconds ??= 0
  duration = `0${seconds}`.slice(-2)
  if (hours !== 0) {
    duration = `${hours}` + ':' + `0${minutes}`.slice(-2) + ':' + duration
  } else {
    duration = `${minutes}` + ':' + duration
  }
  return duration
}

async function sendNotificationEmail (notifications: Notification[], channelThumbnail: string): Promise<Array<PromiseSettledResult<any>>> {
  console.log('sendNotificationEmail =>')
  const promises = notifications.map(async notification => {
    const command = new SendEmailCommand({
      Content: {
        Raw: {
          Data: await getRaw(notification.video, channelThumbnail, notification.subscriber)
        }
      }
    })

    return await client.send(command)
  })

  console.log('<= sendNotificationEmail')
  return await Promise.allSettled(promises)
}

export {
  sendNotificationEmail
}

interface Notification {
  video: VideoFromGoogleApis
  subscriber: string
}
interface MailData {
  videoTitle: string
  videoId: string
  thumbnail: string
  duration: string
  channelId: string
  channelTitle: string
  channelThumbnail: string
  description: string
  unsubscribeLink: string
}
async function getRaw (video: VideoFromGoogleApis, channelThumbnail: string, to: string): Promise<Buffer> {
  if (process.env.STAGE === undefined) throw new Error('STAGE is undefined')

  const largestThumbnail = Object.keys(video.snippet.thumbnails).sort((a, b) => {
    if (video.snippet.thumbnails[a].width < video.snippet.thumbnails[b].width) {
      return 1
    } else {
      return -1
    }
  })[0]

  const channelId = video.snippet.channelId
  const unsubscribeToken = await generateUnsubscribeToken(to, channelId)
  const unsubscribeLink = `https://${process.env.STAGE}.ytfm.app/subscriptions/${channelId}?token=${unsubscribeToken}&action=unsubscribe`

  const duration = getDuration(video)
  const mail = new MailComposer({
    from: {
      address: 'noreply@ytfm.app',
      name: video.snippet.channelTitle
    },
    to,
    headers: {
      'List-Unsubscribe': `<${unsubscribeLink}>`
    },
    subject: video.snippet.title,
    text: `[${duration}] ${video.snippet.title}`,
    html: getHtml({
      videoId: video.id,
      videoTitle: video.snippet.title,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      channelThumbnail,
      thumbnail: video.snippet.thumbnails[largestThumbnail].url,
      duration,
      description: video.snippet.description
        .replace(/#([^\s]+)/g, '<a href="https://www.youtube.com/hashtag/$1">#$1</a>')
        .replace(/\n/g, '<br/>'),
      unsubscribeLink
    })
  })
  return await mail.compile().build()
}

function getHtml (data: MailData): string {
  if (process.env.STAGE === undefined) throw new Error('STAGE is undefined')

  const {
    videoTitle,
    videoId,
    thumbnail,
    duration,
    channelId,
    channelTitle,
    channelThumbnail,
    description,
    unsubscribeLink
  } = data

  return `
<html>
<head>
  <title>
    ${videoTitle}
  </title>
  <style type="text/css">
      * {
          font-family: arial, Arial, sans-serif;
      }
      @media only screen and (max-device-width: 480px) {
          body.suppress-border-on-mobile {
              margin: 0 !important;
              border: 0 !important;
              padding: 0 !important;
          }

          table.outer-container-width, td.outer-container-width {
              width: 640px !important;
          }

          table.inner-container-width, td.inner-container-width {
              width: 600px !important;
          }

          td.footer-font, div.footer-font {
              font-size: 20px !important;
              line-height: 30px !important;
          }

          table.large-section-padding-height, td.large-section-padding-height {
              height: 16px !important;
          }

          table.content-container-width, td.content-container-width {
              width: 540px !important;
          }

          a.video-link-font-class, div.video-link-font-class, td.video-link-font-class {
              font-size: 20px !important;
              line-height: 30px !important;
          }

          table.video-spotlight-width {
              width:600px !important;
              height:332px !important;
          }

      }
  </style>
  <style type="text/css">
      * {
          font-family: arial, Arial, sans-serif;
      }
      @media only screen and (max-device-width: 480px) {
          body[class=suppress-border-on-mobile] {
              margin: 0 !important;
              border: 0 !important;
              padding: 0 !important;
          }

          table[class=outer-container-width], td[class=outer-container-width] {
              width: 640px !important;
          }

          table[class=inner-container-width], td[class=inner-container-width] {
              width: 600px !important;
          }

          td[class=footer-font], div[class=footer-font] {
              font-size: 20px !important;
              line-height: 30px !important;
          }

          table[class=large-section-padding-height], td[class=large-section-padding-height] {
              height: 16px !important;
          }

          table[class=content-container-width], td[class=content-container-width] {
              width: 540px !important;
          }

          a[class=video-link-font-class], div[class=video-link-font-class], td[class=video-link-font-class] {
              font-size: 20px !important;
              line-height: 30px !important;
          }

          table[class=video-spotlight-width] {
              width:600px !important;
              height:332px !important;
          }

          table, td. {
              width: 500px !important;
          }
      }
  </style>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
</head>
<body class="suppress-border-on-mobile">
<table class="outer-container-width" width="680" bgcolor="transparent" align="center" valign="top" cellspacing="0" cellpadding="0" border="0">
  <tr>
    <td class="inner-container-width" width='600'>
      <table class="inner-container-width" width='600' align="center" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td>
            <table class="inner-container-width" width='600' align="center" valign="center" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td>
                  <table class="video-spotlight-width" width="600" align="center" cellspacing="0" cellpadding="0" border="0">
                    <tr style="mso-hide:all">
                      <td colspan="3">
                        <a href="https://${process.env.STAGE}.ytfm.app/watch/${videoId}" style="text-decoration:none; display:block;" class="nonplayable">
                          <table aria-label="${videoTitle}" class="video-spotlight-width" width="600" align="center" background="${thumbnail}"  style="background-repeat:no-repeat;background-size:cover;background-position:center;mso-hide:all" height="338" cellspacing="0" cellpadding="0" border="0">
                            <tr aria-label="${videoTitle}" scope="row" style="mso-hide:all">
                              <td  aria-label="${videoTitle}" class="footer-font" style="color:#fff; text-align:right; font-size: 12px;" valign="bottom" width="600">
                                <div style="margin-bottom:8px; margin-right:8px; border-radius:2px; background-color: #212121; padding:2px 4px; display:inline-block;">${duration}</div>
                              </td>
                            </tr>
                          </table>
                        </a>
                      </td>
                    </tr>
                    <tr><td>
                      <table class="large-section-padding-height" height="16" cellspacing="0" cellpadding="0" border="0">
                        <tr>
                          <td class="large-section-padding-height" height="16"></td>
                        </tr>
                      </table>
                    </td></tr>
                    <tr>
                      <td>
                        <table class="content-container-width" width="600" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                          <tr>
                            <td width="32px">
                              <img style="border-radius: 50%" src="${channelThumbnail}" width="32px"/>
                            </td>
                            <td width="12px"></td>
                            <td >
                              <table class="content-container-width" width="600" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                                <td valign="center" >
                                  <table class="content-container-width" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
                                    <tr>
                                      <td style="padding-bottom:4px">
                                        <a href="https://${process.env.STAGE}.ytfm.app/watch/${videoId}" style="text-decoration:none;">
<span class="video-title-font-class" valign="center" style="font-family:Roboto,sans-serif; font-size:14px; color:#212121; line-height:20px; -webkit-text-size-adjust:none;">
  ${videoTitle}
</span>
                                        </a>
                                      </td>
                                    </tr>
                                    <tr>
                                      <td>
                                        <a class="video-link-font-class" href="https://www.youtube.com/channel/${channelId}" style="font-family:Roboto,sans-serif;font-size:12px; color: #757575;; line-height:16px; letter-spacing:0px; -webkit-text-size-adjust:none; text-decoration:none;">
                                          ${channelTitle}
                                        </a>
                                      </td>
                                    </tr>
                                  </table>
                                </td>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td colspan="3" style="padding-top: 1rem;font-family:Roboto,sans-serif;font-size:12px; color: #757575;; line-height:16px; letter-spacing:0px; -webkit-text-size-adjust:none; text-decoration:none;">${description}</td>
                          </tr>
                          <tr style="height: 40px">
                            <td style="width: 600px" colspan="3">
                              <a class="video-link-font-class" href="${unsubscribeLink}" style="font-family:Roboto,sans-serif;font-size:12px; color: #757575;; line-height:16px; letter-spacing:0px; -webkit-text-size-adjust:none; text-decoration:none;">
                                Unsubscribe channel notification
                              </a>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>
`
}
