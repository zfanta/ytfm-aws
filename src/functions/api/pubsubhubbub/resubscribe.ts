import { EventBridgeHandler } from 'aws-lambda'
import { getImpendingPubsubhubbub } from '@libs/dynamodb'
import createLogger from '@libs/createLogger'
import { pubsubhubbub as pubsubhubbubQueue } from '@libs/sqs'
import { invokeLambdaAsync } from '@libs/lambda'

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
    await pubsubhubbubQueue.send(channelIds)
    await invokeLambdaAsync('sendToPubsubhubbub')
  }
  logger.info('<=')
}

export {
  handler
}
