import middy from '@middy/core'
import middyJsonBodyParser from '@middy/http-json-body-parser'
import cookie from 'cookie'
import { getSession, getUser } from '@libs/dynamodb'
import { createSession } from '@libs/cookie'
import Middy = middy.Middy

function response (statusCode: number, body: string, headers?: Headers): {statusCode: number, body: string, headers?: Headers} {
  return { statusCode, body, headers }
}

const middyfy = (handler): Middy<any, any> => {
  return middy(handler).use(middyJsonBodyParser())
}

function injectUser (handler): any {
  return async (event, context, callback) => {
    console.log('inject user =>')
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
  injectUser
}

interface Headers {
  [header: string]: string|number|boolean
}
