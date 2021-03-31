import { EventBridgeHandler } from 'aws-lambda'
import { getImpendingPubsubhubbub } from '@libs/dynamodb'
import { sendToPubsubhubbub } from '@libs/youtube'
import createLogger from '@libs/createLogger'

const logger = createLogger('/api/pubsubhubbub/resubscribe.ts')

/*
 * From scheduled event
 */
const handler: EventBridgeHandler<any, any, any> = async () => {
  logger.info('=>')
  const channelIds = await getImpendingPubsubhubbub(undefined, undefined)
  if (channelIds.length > 0) {
    logger.info(`Resubscribe ${channelIds.length} channels`)
    logger.info(channelIds)
    await sendToPubsubhubbub(channelIds, 'subscribe')
  }
  logger.info('<=')
}

export {
  handler
}
