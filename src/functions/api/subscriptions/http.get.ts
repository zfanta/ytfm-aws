import 'source-map-support/register'

import { getSubscriptionsWithTitle } from '@libs/dynamodb'
import type { ValidatedEventAPIGatewayProxyEventWithSID } from '@libs/apiGateway'
import { injectSID, middyfy, response } from '@libs/lambda'
import { getUser } from '@libs/cookie'

const get: ValidatedEventAPIGatewayProxyEventWithSID<any> = async (event) => {
  const user = await getUser(event.SID)
  if (user === undefined) return response(404, '')

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

export const handler = middyfy(injectSID(get))
