import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { middyfy, response, injectUser } from '@libs/lambda'
import { updateSubscription, updateSubscriptionEtag } from '@libs/dynamodb'

const patch: ValidatedEventAPIGatewayProxyEventWithUser<any> = async (event) => {
  const { user, body } = event

  if (await updateSubscription(body.channel, user.email, body.notification) === undefined) {
    return response(404, '')
  }

  await updateSubscriptionEtag(user.email, undefined)

  return response(200, JSON.stringify(body))
}

export const handler = middyfy(injectUser(patch))
