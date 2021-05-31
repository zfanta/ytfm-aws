import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { middyfy, response, injectUser, invokeLambdaAsync } from '@libs/lambda'
import { getSubscriptions } from '@libs/youtube'
import { syncChannels, updateUserSyncTime } from '@libs/dynamodb'
import { pubsubhubbub as pubsubhubbubQueue } from '@libs/sqs'

// Sync subscriptions from youtube
const post: ValidatedEventAPIGatewayProxyEventWithUser<any> = async (event) => {
  const { user } = event

  const subscriptions = (await getSubscriptions(user)).map(subscription => ({
    id: subscription.snippet.resourceId.channelId,
    expiresAt: 0,
    information: {
      publishedAt: subscription.snippet.publishedAt,
      title: subscription.snippet.title,
      description: subscription.snippet.description,
      thumbnails: subscription.snippet.thumbnails
    }
  }))

  const syncedAt = (await updateUserSyncTime(user.email)).valueOf()
  const { channels, strangeChannels } = await syncChannels(user.email, subscriptions)
  const result = {
    syncedAt,
    updatedAt: syncedAt,
    channels
  }

  await pubsubhubbubQueue.send(strangeChannels.map(a => a.id))
  await invokeLambdaAsync('sendToPubsubhubbub')

  return response(200, JSON.stringify(result))
}

export const handler = middyfy(injectUser(post))
