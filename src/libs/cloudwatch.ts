import { CloudWatchLogsClient, PutLogEventsCommand } from '@aws-sdk/client-cloudwatch-logs'

const client = new CloudWatchLogsClient({
  region: 'us-east-1'
})

async function putVideoLog (videoId: string, sequenceToken?: string): Promise<void> {
  if (process.env.STAGE === undefined) {
    throw new Error('process.env.STAGE is undefined')
  }

  const command = new PutLogEventsCommand({
    logEvents: [{ message: videoId, timestamp: new Date().valueOf() }],
    logGroupName: `/aws/lambda/ytfm-${process.env.STAGE}-pubsubhubbubHttpPost`,
    logStreamName: `ytfm-${process.env.STAGE}-pubsubhubbubHttpPost`,
    sequenceToken
  })

  try {
    await client.send(command)
  } catch (e) {
    if (e.expectedSequenceToken !== undefined) {
      return await putVideoLog(videoId, e.expectedSequenceToken)
    }
    throw e
  }
}

export {
  putVideoLog
}
