import 'source-map-support/register'

import { SQSHandler } from 'aws-lambda'
import { SESv2Client, SendCustomVerificationEmailCommand, SendEmailCommand } from '@aws-sdk/client-sesv2'
import { Video } from '@libs/types'
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

// sqs.pushNotificationEmail
async function sendNotificationEmail (notifications: Notification[]): Promise<Array<PromiseSettledResult<any>>> {
  console.log('sendNotificationEmail =>')
  const promises = notifications.map(async notification => {
    const command = new SendEmailCommand({
      Content: {
        Template: {
          TemplateName: templates.notification.TemplateName,
          TemplateData: JSON.stringify({ videoTitle: notification.video.title })
        }
      },
      FromEmailAddress: `=?UTF-8?B?${Buffer.from(notification.video.channelName).toString('base64')}?= <noreply@ytfm.app>`,
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
  video: Video
  subscriber: string
}
