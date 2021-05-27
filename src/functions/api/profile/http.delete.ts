import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { middyfy, response, injectUser } from '@libs/lambda'
import { deleteAccount } from '@libs/dynamodb'
import { revokeToken } from '@libs/oauth2'

const deleteHandler: ValidatedEventAPIGatewayProxyEventWithUser<any> = async (event) => {
  const { user } = event
  await Promise.all([
    deleteAccount(user.email),
    revokeToken(user.token.access_token)
  ])

  return response(200, '')
}

export const handler = middyfy(injectUser(deleteHandler))
