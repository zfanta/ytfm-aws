import 'source-map-support/register'

import { getSubscriptionsWithTitle } from '@libs/dynamodb'
import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import cookie from 'cookie'
import { getUser } from '@libs/cookie'

const get: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  if (event.headers === undefined) return response(400, 'Invalid header')
  if (event.headers.Cookie === undefined) return response(400, 'Invalid header')

  const { SID } = cookie.parse(event.headers.Cookie)
  if (SID === undefined) return response(400, 'SID is undefined')

  const user = await getUser(SID)
  if (user === undefined) return response(404, '')

  const channels = (await getSubscriptionsWithTitle(user.email)).map(subscription => ({
    id: subscription.channel,
    enabled: subscription.enabled,
    title: subscription.title
  }))

  const result = {
    syncedAt: user.syncedAt,
    channels
  }

  return response(200, JSON.stringify(result))
}

export const handler = middyfy(get)
