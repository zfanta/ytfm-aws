import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { injectUser, middyfy, responseProfile } from '@libs/lambda'

const get: ValidatedEventAPIGatewayProxyEventWithUser<any> = async (event) => {
  const { user } = event
  return responseProfile(user)
}

export const handler = middyfy(injectUser(get))
