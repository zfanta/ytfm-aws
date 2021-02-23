import 'source-map-support/register'

import { getSubscriptions } from '@libs/dynamodb'
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

  return response(200, JSON.stringify(await getSubscriptions(user.email)))
}

export const handler = middyfy(get)
