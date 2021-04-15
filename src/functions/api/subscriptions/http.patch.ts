import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { middyfy, response, injectUser } from '@libs/lambda'
import { updateSubscription } from '@libs/dynamodb'

const patch: ValidatedEventAPIGatewayProxyEventWithUser<any> = async (event) => {
  const { user, body } = event

  const currentTime = new Date()

  if (await updateSubscription(body.channel, user.email, body.notification, currentTime) === undefined) {
    return response(404, '')
  }

  return response(200, JSON.stringify(Object.assign({}, body, { updatedAt: currentTime.valueOf() })))
}

export const handler = middyfy(injectUser(patch))
