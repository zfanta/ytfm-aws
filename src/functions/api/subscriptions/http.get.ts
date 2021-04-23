import 'source-map-support/register'

import { getSubscriptionsWithTitle, getSubscriptionWithTitle } from '@libs/dynamodb'
import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { injectUser, middyfy, response } from '@libs/lambda'

const get: ValidatedEventAPIGatewayProxyEventWithUser<any> = async (event, context) => {
  console.log(context)
  const { user } = event
  const channelId = event.pathParameters?.channelId

  let subscriptions: any[] = []
  if (channelId !== undefined) {
    if (user.permissions?.unsubscribe !== undefined && user.permissions.unsubscribe !== channelId) {
      return response(401)
    }
    const subscription = await getSubscriptionWithTitle(user.email, channelId)
    if (subscription !== undefined) {
      subscriptions.push(subscription)
    }
  } else {
    subscriptions = await getSubscriptionsWithTitle(user.email)
  }

  const channels = subscriptions.map(subscription => ({
    id: subscription.channel,
    notification: subscription.notification,
    title: subscription.title,
    thumbnail: subscription.thumbnail
  }))

  const result = {
    syncedAt: user.syncedAt,
    updatedAt: user.updatedAt,
    channels
  }

  return response(200, JSON.stringify(result))
}

export const handler = middyfy(injectUser(get))
