import { EventBridgeHandler } from 'aws-lambda'
import { pubsubhubbub } from '@libs/sqs'
import { getImpendingPubsubhubbub } from '@libs/dynamodb'

/*
 * From scheduled event
 */
const handler: EventBridgeHandler<any, any, any> = async () => {
  console.log('Pubsubhubbub resubscribe =>')

  const channelIds = await getImpendingPubsubhubbub()
  if (channelIds.length > 0) {
    console.log(`Resubscribe ${channelIds.length} channels`)
    await pubsubhubbub('subscribe', channelIds)
  }

  console.log('<= Pubsubhubbub resubscribe')
}

export {
  handler
}
