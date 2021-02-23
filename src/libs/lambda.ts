import middy from '@middy/core'
import middyJsonBodyParser from '@middy/http-json-body-parser'
import Middy = middy.Middy

function response (statusCode: number, body: string, headers?: Headers): {statusCode: number, body: string, headers?: Headers} {
  return { statusCode, body, headers }
}

const middyfy = (handler): Middy<any, any> => {
  return middy(handler).use(middyJsonBodyParser())
}

export {
  middyfy,
  response
}

interface Headers {
  [header: string]: string|number|boolean
}
