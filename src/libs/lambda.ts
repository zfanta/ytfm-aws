import middy from '@middy/core'
import middyJsonBodyParser from '@middy/http-json-body-parser'
import cookie from 'cookie'
import Middy = middy.Middy

function response (statusCode: number, body: string, headers?: Headers): {statusCode: number, body: string, headers?: Headers} {
  return { statusCode, body, headers }
}

const middyfy = (handler): Middy<any, any> => {
  return middy(handler).use(middyJsonBodyParser())
}

function injectSID (handler): any {
  return (event, context, callback) => {
    if (event.headers === undefined) return response(400, 'Invalid header')
    if (event.headers.Cookie === undefined && event.headers.cookie === undefined) return response(400, 'Invalid header')

    const { SID } = cookie.parse(event.headers.Cookie ?? event.headers.cookie)
    if (SID === undefined) return response(400, 'SID is undefined')

    event.SID = SID

    return handler(event, context, callback)
  }
}

export {
  middyfy,
  response,
  injectSID
}

interface Headers {
  [header: string]: string|number|boolean
}
