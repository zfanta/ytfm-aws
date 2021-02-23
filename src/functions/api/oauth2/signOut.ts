import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import { updateUser } from '@libs/cookie'
import cookie from 'cookie'

const get: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  if (event.headers.Cookie === undefined) return response(400, 'Invalid header')

  const cookies = cookie.parse(event.headers.Cookie)
  const SID = cookies.SID

  if (SID === undefined) return response(400, 'SID is undefined')

  await updateUser(SID, 'empty')

  return response(303, '', { Location: '/' })
}

export const handler = middyfy(get)
