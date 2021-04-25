import middy from '@middy/core'
import middyJsonBodyParser from '@middy/http-json-body-parser'
import cookie from 'cookie'
import { getSession, getUser, User } from '@libs/dynamodb'
import { createSession } from '@libs/cookie'
import { decryptUnsubscribeToken } from '@libs/crypto'
import type { ValidatedAPIGatewayProxyEvent, ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
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

async function getUserFromToken (event: ValidatedAPIGatewayProxyEvent<any>): Promise<User|undefined> {
  async function decryptUserFromUnsubscribeToken (token: string): Promise<undefined|User> {
    const unsubscribeData = await decryptUnsubscribeToken(token)
    if (unsubscribeData === undefined) return undefined

    const user = await getUser(unsubscribeData.user)
    if (user === undefined) return undefined

    user.permissions = {
      unsubscribe: unsubscribeData.channelId
    }
    return user
  }

  let token, action

  if (event.queryStringParameters !== null) {
    token = event.queryStringParameters.token
    action = event.queryStringParameters.action
  }

  if (event.body !== null) {
    token = event.body.token
    action = event.body.action
  }

  if (action === 'unsubscribe') {
    return token !== undefined ? await decryptUserFromUnsubscribeToken(token) : undefined
  }
}

function injectUser (handler): ValidatedEventAPIGatewayProxyEventWithUser<any> {
  return async (event, context, callback) => {
    console.log('inject user =>')
    let user = await getUserFromToken(event)
    if (user !== undefined) {
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

    user = await getUser(session.user)
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
