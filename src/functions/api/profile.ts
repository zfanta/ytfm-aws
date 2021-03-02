import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import { getSession } from '@libs/dynamodb'
import cookie from 'cookie'

const get: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  if (event.headers.Cookie === undefined && event.headers.cookie === undefined) return response(400, 'Invalid header')

  const cookies = cookie.parse(event.headers.Cookie ?? event.headers.cookie)
  const SID = cookies.SID

  if (SID === undefined) return response(400, 'SID is undefined')

  const result = await getSession(SID)

  if (result === undefined) return response(404, '')

  if (result.user === 'empty') return response(404, '')

  return response(200, JSON.stringify({ email: result.user }))
}

export const handler = middyfy(get)
