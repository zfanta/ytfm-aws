import { EventBridgeHandler } from 'aws-lambda'
import { getImpendingPubsubhubbub } from '@libs/dynamodb'
import { sendToPubsubhubbub } from '@libs/youtube'

/*
 * From scheduled event
 */
const handler: EventBridgeHandler<any, any, any> = async () => {
  console.log('Pubsubhubbub resubscribe =>')

  const channelIds = await getImpendingPubsubhubbub()
  if (channelIds.length > 0) {
    console.log(`Resubscribe ${channelIds.length} channels`)
    await sendToPubsubhubbub(channelIds, 'subscribe')
  }

  console.log('<= Pubsubhubbub resubscribe')
}

export {
  handler
}
