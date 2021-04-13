import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { middyfy, response, injectUser } from '@libs/lambda'
import { getSubscriptions } from '@libs/youtube'
import { syncChannels, updateSubscriptionEtag, updateUserSyncTime } from '@libs/dynamodb'
import { generateEtag } from '@libs/crypto'

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
  const channels = await syncChannels(user.email, subscriptions)
  const result = {
    syncedAt,
    channels
  }

  const newEtag = await generateEtag(user.email, new Date().valueOf())
  await updateSubscriptionEtag(user.email, newEtag)
  const headers = {
    Etag: newEtag
  }

  return response(200, JSON.stringify(result), headers)
}

export const handler = middyfy(injectUser(post))
