import middy from '@middy/core'
import middyJsonBodyParser from '@middy/http-json-body-parser'
import Middy = middy.Middy

export const middyfy = (handler): Middy<any, any> => {
  return middy(handler).use(middyJsonBodyParser())
}
