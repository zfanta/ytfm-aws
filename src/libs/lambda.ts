import middy from '@middy/core'
import middyJsonBodyParser from '@middy/http-json-body-parser'
import Middy = middy.Middy

function response (statusCode: number, body: string): {statusCode: number, body: string} {
  return { statusCode, body }
}

const middyfy = (handler): Middy<any, any> => {
  return middy(handler).use(middyJsonBodyParser())
}

export {
  middyfy,
  response
}
