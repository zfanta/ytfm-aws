import middy from '@middy/core'
import middyJsonBodyParser from '@middy/http-json-body-parser'
import cookie from 'cookie'
import { getSession, getUser, User } from '@libs/dynamodb'
import { createSession } from '@libs/cookie'
import { decryptUnsubscribeToken } from '@libs/crypto'
import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import Middy = middy.Middy

function response (statusCode: number, body: string = '', headers?: Headers): {statusCode: number, body: string, headers?: Headers} {
  return { statusCode, body, headers }
}

function responseProfile (user: User): {statusCode: number, body: string, headers?: Headers} {
  const body = JSON.stringify({
    email: user.email,
    photos: user.photos,
    notification: user.notification,
    updatedAt: user.updatedAt
  })
  return {
    statusCode: 200,
    body
  }
}

const middyfy = (handler): Middy<any, any> => {
  return middy(handler).use(middyJsonBodyParser())
}

function injectUser (handler): ValidatedEventAPIGatewayProxyEventWithUser<any> {
  return async (event, context, callback) => {
    console.log('inject user =>')

    if (
      (event.path.startsWith('/api/subscriptions') || event.path.startsWith('/api/profile')) &&
      event.httpMethod === 'PATCH' &&
      event.body.token !== undefined
    ) {
      const unsubscribeData = await decryptUnsubscribeToken(event.body.token)
      if (unsubscribeData === undefined) return response(401, '')

      const user = await getUser(unsubscribeData.user)
      if (user === undefined) return response(401, '')

      event.user = user
      return handler(event, context, callback)
    }

    if (event.headers === undefined) return response(400, 'Invalid header')
    if (event.headers.Cookie === undefined && event.headers.cookie === undefined) return response(400, 'Invalid header')

    const { SID } = cookie.parse(event.headers.Cookie ?? event.headers.cookie)
    if (SID === undefined) return response(400, 'SID is undefined')

    console.log('SID:', SID)
    // If Session is expired issue a new session
    const session = await getSession(SID)
    console.log('session:', session)
    if (session === undefined) {
      const newSID: string = await createSession()
      console.log('new SID:', newSID)
      const nextYear = 60 * 60 * 24 * 365
      return response(401, '', {
        'Set-Cookie': `SID=${newSID}; Max-age=${nextYear}; Path=/`
      })
    }

    if (session.user === 'empty') {
      return response(401, '')
    }

    const user = await getUser(session.user)
    if (user === undefined) {
      return response(401, '')
    }

    event.user = user

    return handler(event, context, callback)
  }
}

export {
  middyfy,
  response,
  responseProfile,
  injectUser
}

interface Headers {
  [header: string]: string|number|boolean
}
