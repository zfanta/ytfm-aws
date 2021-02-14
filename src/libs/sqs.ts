import {
  GetQueueUrlCommand,
  SendMessageBatchCommand,
  SendMessageBatchRequestEntry,
  SQSClient
} from '@aws-sdk/client-sqs'

async function pubsubhubbub (mode: 'subscribe'|'unsubscribe', channelIds: string[]): Promise<void> {
  console.log('Send to SQS =>')

  if (process.env.PUBSUBHUBBUB_QUEUE_NAME === undefined) throw new Error('PUBSUBHUBBUB_QUEUE_NAME is undefined')

  console.log('Number of channels:', channelIds.length)

  // TODO: region hard coding
  const sqs = new SQSClient({ region: 'us-east-1' })

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

  // Get queue url
  const command = new GetQueueUrlCommand({
    QueueName: process.env.PUBSUBHUBBUB_QUEUE_NAME
  })
  const { QueueUrl } = await sqs.send(command)
  if (QueueUrl === undefined) throw new Error('Cannot find queue url')

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
  console.log('<= Send to SQS')
}

export {
  pubsubhubbub
}
