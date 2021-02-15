import 'source-map-support/register'

import { SQSHandler } from 'aws-lambda'
import { SESv2Client, SendCustomVerificationEmailCommand } from '@aws-sdk/client-sesv2'

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
      TemplateName: 'verification',
      EmailAddress: to
    })

    return await client.send(command)
  })

  return await Promise.allSettled(promises)
}

const handler: SQSHandler = async (event) => {
  console.log('Send email =>')

  const verifications = event.Records
    .filter(record => record.messageAttributes.type.stringValue === 'verification')
    .map(record => record.messageAttributes.to.stringValue)
    .filter(to => to !== undefined)

  const result = await sendVerificationEmail(verifications as string[])
  result.forEach(result => {
    if (result.status === 'rejected') {
      console.error(result)
    }
  })
  // TODO: error handling

  // TODO: send ytfm

  console.log('<= Send email')
}

export {
  handler
}
