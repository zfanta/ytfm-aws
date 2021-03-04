import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEventWithSID } from '@libs/apiGateway'
import { middyfy, response, injectSID } from '@libs/lambda'
import { getUser } from '@libs/cookie'
import { updateSubscription } from '@libs/dynamodb'

const patch: ValidatedEventAPIGatewayProxyEventWithSID<any> = async (event) => {
  const user = await getUser(event.SID, false)
  if (user === undefined) return response(404, '')

  const { body } = event

  if (await updateSubscription(body.channel, user.email, body.notification) === undefined) {
    return response(404, '')
  }

  return response(200, JSON.stringify(body))
}

export const handler = middyfy(injectSID(patch))
