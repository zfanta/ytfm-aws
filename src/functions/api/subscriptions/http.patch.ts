import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import cookie from 'cookie'
import { getUser } from '@libs/cookie'
import { updateSubscription } from '@libs/dynamodb'

const patch: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  if (event.headers === undefined) return response(400, 'Invalid header')
  if (event.headers.Cookie === undefined && event.headers.cookie === undefined) return response(400, 'Invalid header')

  const { SID } = cookie.parse(event.headers.Cookie ?? event.headers.cookie)
  if (SID === undefined) return response(400, 'SID is undefined')

  const user = await getUser(SID, false)
  if (user === undefined) return response(404, '')

  const { body } = event

  if (await updateSubscription(body.channel, user.email, body.notification) === undefined) {
    return response(404, '')
  }

  return response(200, JSON.stringify(body))
}

export const handler = middyfy(patch)
