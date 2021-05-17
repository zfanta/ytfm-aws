import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEventWithUser } from '@libs/apiGateway'
import { injectUser, middyfy, response, responseProfile } from '@libs/lambda'
import { getUser, updateUserNotification, updateUserRegion } from '@libs/dynamodb'
import schema from './http.patch.schema'

const get: ValidatedEventAPIGatewayProxyEventWithUser<typeof schema> = async (event) => {
  const { user, body } = event
  let updated = false

  if (body.notification !== undefined && body.notification !== user.notification) {
    await updateUserNotification(user.email, body.notification)
    updated = true
  }

  if (body.region !== undefined) {
    await updateUserRegion(user.email, body.region)
    updated = true
  }

  if (updated) {
    const userUpdated = await getUser(user.email)
    if (userUpdated === undefined) {
      return response(500, 'Failed to update user')
    }

    return responseProfile(userUpdated)
  }

  return responseProfile(user)
}

export const handler = middyfy(injectUser(get))
