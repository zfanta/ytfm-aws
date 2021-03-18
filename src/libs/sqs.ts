/*
 * Deprecated
 */

import {
  GetQueueUrlCommand,
  SendMessageCommand,
  SQSClient
} from '@aws-sdk/client-sqs'

// TODO: region hard coding
const sqs = new SQSClient({ region: 'us-east-1' })

async function getQueueUrl (QueueName: string): Promise<string> {
  const command = new GetQueueUrlCommand({ QueueName })
  const { QueueUrl } = await sqs.send(command)
  if (QueueUrl === undefined) throw new Error('Cannot find queue url')

  return QueueUrl
}

async function pushVerificationEmail (to: string): Promise<void> {
  if (process.env.EMAIL_QUEUE_NAME === undefined) throw new Error('PUBSUBHUBBUB_QUEUE_NAME is undefined')

  console.log(`Send to SQS[${process.env.EMAIL_QUEUE_NAME}] =>`)

  const QueueUrl = await getQueueUrl(process.env.EMAIL_QUEUE_NAME)
  const command = new SendMessageCommand({
    QueueUrl,
    // TODO: replacement data
    MessageBody: 'TODO',
    DelaySeconds: undefined,
    MessageDeduplicationId: undefined,
    MessageGroupId: undefined,
    MessageAttributes: {
      type: { StringValue: 'verification', DataType: 'String' },
      to: { StringValue: to, DataType: 'String' }
    }
  })

  await sqs.send(command)

  console.log(`<= Send to SQS[${process.env.EMAIL_QUEUE_NAME}]`)
}

export {
  pushVerificationEmail
}
