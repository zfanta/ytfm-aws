import 'source-map-support/register'

import { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy } from '@libs/lambda'
import cookie from 'cookie'
import { createSession, refresh } from '@libs/cookie'

const getHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const cookies = event.headers?.Cookie !== undefined ? cookie.parse(event.headers.Cookie) : undefined

  let SID: string

  if (cookies?.SID !== undefined) {
    SID = await refresh(cookies.SID)
  } else {
    SID = await createSession()
  }

  const nextYear = 60 * 60 * 24 * 365

  return {
    body: '',
    statusCode: 200,
    headers: {
      'Set-Cookie': `SID=${SID}; Max-age=${nextYear}; Path=/`
    }
  }
}

export const handler = middyfy(getHandler)
