import { EventBridgeHandler } from 'aws-lambda'
import { DynamoDBClient, ExecuteStatementCommand } from '@aws-sdk/client-dynamodb'
import { pubsubhubbub } from '@libs/sqs'

/*
 * From scheduled event
 */

const client = new DynamoDBClient({
  // TODO
  region: 'us-east-1'
})

const handler: EventBridgeHandler<any, any, any> = async () => {
  console.log('Pubsubhubbub resubscribe =>')

  if (process.env.CHANNELS_TABLE_NAME === undefined) throw new Error('CHANNELS_TABLE_NAME is undefined')

  const currentTime = new Date().valueOf()
  const impendingTime = currentTime + (1000 * 60 * 60 * 24) // 1 day

  console.log(`Get before ${new Date(impendingTime).toISOString()}`)

  const command = new ExecuteStatementCommand({
    ConsistentRead: false,
    Statement: `SELECT * FROM "${process.env.CHANNELS_TABLE_NAME}" where expiresAt < ${impendingTime}`
  })

  const result = await client.send(command)

  if (result.NextToken !== undefined) {
    // TODO
    console.warn('NextToken is ignored')
  }

  const channelIds = result.Items?.map(item => item.id.S as string)
  if (channelIds !== undefined && channelIds.length > 0) {
    console.log(`Resubscribe ${channelIds.length} channels`)
    await pubsubhubbub('subscribe', channelIds)
  }

  console.log('<= Pubsubhubbub resubscribe')
}

export {
  handler
}
