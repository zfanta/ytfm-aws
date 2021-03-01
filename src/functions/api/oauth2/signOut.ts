import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import cookie from 'cookie'
import { updateSessionUser } from '@libs/dynamodb'

const get: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  if (event.headers.Cookie === undefined && event.headers.cookie === undefined) return response(400, 'Invalid header')

  const cookies = cookie.parse(event.headers.Cookie ?? event.headers.cookie)
  const SID = cookies.SID

  if (SID === undefined) return response(400, 'SID is undefined')

  await updateSessionUser(SID, 'empty')

  return response(303, '', { Location: '/' })
}

export const handler = middyfy(get)
