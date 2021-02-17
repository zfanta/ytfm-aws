import {
  GetQueueUrlCommand,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
  SendMessageCommand,
  SQSClient
} from '@aws-sdk/client-sqs'
import { Video } from '@libs/types'

// TODO: region hard coding
const sqs = new SQSClient({ region: 'us-east-1' })

async function getQueueUrl (QueueName: string): Promise<string> {
  const command = new GetQueueUrlCommand({ QueueName })
  const { QueueUrl } = await sqs.send(command)
  if (QueueUrl === undefined) throw new Error('Cannot find queue url')

  return QueueUrl
}

async function pubsubhubbub (mode: 'subscribe'|'unsubscribe', channelIds: string[]): Promise<void> {
  if (process.env.PUBSUBHUBBUB_QUEUE_NAME === undefined) throw new Error('PUBSUBHUBBUB_QUEUE_NAME is undefined')

  console.log(`Send to SQS[${process.env.PUBSUBHUBBUB_QUEUE_NAME}] =>`)

  console.log('Number of channels:', channelIds.length)

  // limit 10
  const entries: SendMessageBatchRequestEntry[][] = []
  const currentTime = new Date().toISOString().replace(/:/g, '__').replace(/\./g, '_')
  for (let i = 0; i < channelIds.length; i += 10) {
    entries.push(channelIds.slice(i, i + 10).map((channelId, index) => ({
      Id: `${currentTime}-${i + index}`,
      MessageBody: JSON.stringify({ channelId, mode: 'subscribe' }),
      MessageAttributes: {
        channelId: {
          StringValue: channelId,
          DataType: 'String'
        },
        mode: {
          StringValue: mode,
          DataType: 'String'
        }
      }
    })))
  }

  const QueueUrl = await getQueueUrl(process.env.PUBSUBHUBBUB_QUEUE_NAME)

  await Promise.all(entries.map(async entry => {
    const command = new SendMessageBatchCommand({
      QueueUrl,
      Entries: entry
    })
    const data = await sqs.send(command)
    if (data.Failed !== undefined) {
      console.log('Failed:', data.Failed)
    }
  }))
  console.log(`<= Send to SQS[${process.env.PUBSUBHUBBUB_QUEUE_NAME}]`)
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

async function pushNotificationEmail (video: Video, subscribers: string[]): Promise<void> {
  console.log('pushNotificationEmail =>')

  if (process.env.EMAIL_QUEUE_NAME === undefined) throw new Error('EMAIL_QUEUE_NAME is undefined')

  // limit 10
  const entries: SendMessageBatchRequestEntry[][] = []
  const currentTime = new Date().toISOString().replace(/:/g, '__').replace(/\./g, '_')
  for (let i = 0; i < subscribers.length; i += 10) {
    entries.push(subscribers.slice(i, i + 10).map((subscriber, index) => ({
      Id: `${currentTime}-${i + index}`,
      MessageBody: JSON.stringify({ subscriber, video }),
      MessageAttributes: {
        videoId: {
          StringValue: video.id,
          DataType: 'String'
        },
        to: {
          StringValue: subscriber,
          DataType: 'String'
        },
        type: {
          StringValue: 'notification',
          DataType: 'String'
        }
      }
    })))
  }

  const QueueUrl = await getQueueUrl(process.env.EMAIL_QUEUE_NAME)

  await Promise.all(entries.map(async entry => {
    const command = new SendMessageBatchCommand({
      QueueUrl,
      Entries: entry
    })
    const data = await sqs.send(command)
    if (data.Failed !== undefined) {
      console.log('Failed:', data.Failed)
    }
  }))

  console.log('<= pushNotificationEmail')
}

export {
  pubsubhubbub,
  pushVerificationEmail,
  pushNotificationEmail
}
