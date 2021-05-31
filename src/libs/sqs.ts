import 'source-map-support/register'
import {
  GetQueueUrlCommand,
  SendMessageBatchCommand,
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand
} from '@aws-sdk/client-sqs'
import type { SendMessageBatchRequestEntry } from '@aws-sdk/client-sqs'
import { Message } from '@aws-sdk/client-sqs/models/models_0'

const client = new SQSClient({ region: 'us-east-1' })

const pubsubhubbub = {
  send: async (channelIds: string[]): Promise<void> => {
    console.log('Send to pubsubhubbub queue =>')

    if (process.env.PUBSUBHUBBUB_QUEUE_NAME === undefined) throw new Error('PUBSUBHUBBUB_QUEUE_NAME is undefined')

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
            StringValue: 'subscribe',
            DataType: 'String'
          }
        }
      })))
    }

    // Get queue url
    const command = new GetQueueUrlCommand({
      QueueName: process.env.PUBSUBHUBBUB_QUEUE_NAME
    })
    const { QueueUrl } = await client.send(command)
    if (QueueUrl === undefined) throw new Error('Cannot find queue url')

    await Promise.all(entries.map(async entry => {
      const command = new SendMessageBatchCommand({
        QueueUrl,
        Entries: entry
      })
      const data = await client.send(command)
      if (data.Failed !== undefined) {
        console.log('Failed:', data.Failed)
      }
    }))
    console.log('<= Send to pubsubhubbub queue')
  },
  receive: async (): Promise<Message|undefined> => {
    const { QueueUrl } = await client.send(new GetQueueUrlCommand({
      QueueName: process.env.PUBSUBHUBBUB_QUEUE_NAME
    }))
    if (QueueUrl === undefined) throw new Error('Cannot find queue url')

    const receiveMessageCommand = new ReceiveMessageCommand({
      QueueUrl,
      MaxNumberOfMessages: 1,
      WaitTimeSeconds: 1
    })
    const response = await client.send(receiveMessageCommand)
    if (response.Messages === undefined || response.Messages.length === 0) {
      return undefined
    }

    const deleteMessageCommand = new DeleteMessageCommand({
      QueueUrl,
      ReceiptHandle: response.Messages[0].ReceiptHandle
    })
    await client.send(deleteMessageCommand)

    return response.Messages[0]
  }
}

export {
  pubsubhubbub
}
