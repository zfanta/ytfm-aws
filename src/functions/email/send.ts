import 'source-map-support/register'

import { SQSHandler } from 'aws-lambda'
import { SESv2Client, SendCustomVerificationEmailCommand, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { VideoFromGoogleApis } from '@libs/types'
import * as templates from './templates'

/*
 * From sqs email
 */

// TODO: region name
const client = new SESv2Client({ region: 'us-east-1' })

/* TODO: does not work in sandbox mode
 * BadRequestException: Production access not granted. Please request production access prior to sending custom verification emails
 */
async function sendVerificationEmail (to: string[]): Promise<Array<PromiseSettledResult<any>>> {
  const promises = to.map(async to => {
    const command = new SendCustomVerificationEmailCommand({
      TemplateName: templates.verification.TemplateName,
      EmailAddress: to
    })

    return await client.send(command)
  })

  return await Promise.allSettled(promises)
}

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

// sqs.pushNotificationEmail
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

    console.log('command:', command.input)

    return await client.send(command)
  })

  console.log('<= sendNotificationEmail')
  return await Promise.allSettled(promises)
}

const handler: SQSHandler = async (event) => {
  console.log('Send email =>')

  // send verification
  const verifications = event.Records
    .filter(record => record.messageAttributes.type.stringValue === 'verification')
    .map(record => record.messageAttributes.to.stringValue)
    .filter(to => to !== undefined)

  if (verifications.length !== 0) {
    console.log('Verification:', verifications.length)
  }

  let result = await sendVerificationEmail(verifications as string[])
  result.forEach(result => {
    if (result.status === 'rejected') {
      console.error(result)
    }
  })
  // TODO: error handling

  // send notification
  const notifications = event.Records
    .filter(record => record.messageAttributes.type.stringValue === 'notification')
    .map(record => JSON.parse(record.body) as Notification)

  if (notifications.length !== 0) {
    console.log('Notifications:', notifications.length)
  }

  result = await sendNotificationEmail(notifications)
  result.forEach(result => {
    if (result.status === 'rejected') {
      console.error(result)
    }
  })

  console.log('<= Send email')
}

export {
  handler
}

interface Notification {
  video: VideoFromGoogleApis
  subscriber: string
}
