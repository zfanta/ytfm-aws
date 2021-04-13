import 'source-map-support/register'

import { getSubscriptionsWithTitle } from '@libs/dynamodb'
import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { injectUser, middyfy, response } from '@libs/lambda'

const get: ValidatedEventAPIGatewayProxyEventWithUser<any> = async (event) => {
  const { user } = event

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

  return response(200, JSON.stringify(result))
}

export const handler = middyfy(injectUser(get))
