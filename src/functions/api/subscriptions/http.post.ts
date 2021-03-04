import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEventWithSID } from '@libs/apiGateway'
import { middyfy, response, injectSID } from '@libs/lambda'
import { getUser } from '@libs/cookie'
import { getSubscriptions } from '@libs/youtube'
import { syncChannels, updateUserSyncTime } from '@libs/dynamodb'

// Sync subscriptions from youtube
const post: ValidatedEventAPIGatewayProxyEventWithSID<any> = async (event) => {
  const user = await getUser(event.SID, true)
  if (user === undefined) return response(404, '')

  const subscriptions = (await getSubscriptions(user.token.access_token)).map(subscription => ({
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

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  }
}

export const handler = middyfy(injectSID(post))
