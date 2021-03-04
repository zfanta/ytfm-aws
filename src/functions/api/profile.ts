import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { injectUser, middyfy, response } from '@libs/lambda'

const get: ValidatedEventAPIGatewayProxyEventWithUser<any> = async (event) => {
  const { user } = event
  return response(200, JSON.stringify({ email: user.email }))
}

export const handler = middyfy(injectUser(get))
