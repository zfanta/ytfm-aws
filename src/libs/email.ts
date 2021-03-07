import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2'
import * as templates from '../functions/email/templates'
import { VideoFromGoogleApis } from '@libs/types'

// TODO: region name
const client = new SESv2Client({ region: 'us-east-1' })

function makeTemplateData (video: VideoFromGoogleApis): string {
  // https://en.wikipedia.org/wiki/ISO_8601#Durations
  const duration = video.contentDetails.duration
    .replace(/^PT/, '') // remove first 'PT'
    .split(/[HMS]/) // split #H#M#S
    .slice(0, -1) // remove last empty element
    .map(s => `00${s}`.slice(-2)) // add left zero padding
    .join(':') // join 'H:M:S'
    .replace(/^0/, '') // remove first zero

  const largestThumbnail = Object.keys(video.snippet.thumbnails).sort((a, b) => {
    if (video.snippet.thumbnails[a].width < video.snippet.thumbnails[b].width) {
      return 1
    } else {
      return -1
    }
  })[0]

  const data = {
    videoId: video.id,
    videoTitle: video.snippet.title,
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    thumbnail: video.snippet.thumbnails[largestThumbnail].url,
    duration
  }

  return JSON.stringify(data)
}

async function sendNotificationEmail (notifications: Notification[]): Promise<Array<PromiseSettledResult<any>>> {
  console.log('sendNotificationEmail =>')
  const promises = notifications.map(async notification => {
    const TemplateData = makeTemplateData(notification.video)

    const command = new SendEmailCommand({
      Content: {
        Template: {
          TemplateName: templates.notification.TemplateName,
          TemplateData
        }
      },
      FromEmailAddress: `=?UTF-8?B?${Buffer.from(notification.video.snippet.channelTitle).toString('base64')}?= <noreply@ytfm.app>`,
      Destination: {
        ToAddresses: [notification.subscriber]
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
