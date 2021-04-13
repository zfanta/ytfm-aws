import 'source-map-support/register'

import { getSubscriptionsWithTitle, updateSubscriptionEtag } from '@libs/dynamodb'
import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { injectUser, middyfy, response } from '@libs/lambda'
import { generateEtag } from '@libs/crypto'

const get: ValidatedEventAPIGatewayProxyEventWithUser<any> = async (event) => {
  const { user } = event

  const etag = event.headers['If-None-Match'] ?? event.headers['if-none-match']
  if (etag !== undefined && etag === user.subscriptionEtag) {
    return response(304)
  }

  const channels = (await getSubscriptionsWithTitle(user.email)).map(subscription => ({
    id: subscription.channel,
    notification: subscription.notification,
    title: subscription.title,
    thumbnail: subscription.thumbnail
  }))

  const result = {
    syncedAt: user.syncedAt,
    channels
  }

  const newEtag = await generateEtag(user.email, new Date().valueOf())
  await updateSubscriptionEtag(user.email, newEtag)
  const headers = {
    Etag: newEtag
  }

  return response(200, JSON.stringify(result), headers)
}

export const handler = middyfy(injectUser(get))
