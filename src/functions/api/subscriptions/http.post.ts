import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import cookie from 'cookie'
import { getUser } from '@libs/cookie'
import { getSubscriptions } from '@libs/youtube'
import { syncChannels, updateUserSyncTime } from '@libs/dynamodb'

// Sync subscriptions from youtube
const post: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  if (event.headers === undefined) return response(400, 'Invalid header')
  if (event.headers.Cookie === undefined) return response(400, 'Invalid header')

  const { SID } = cookie.parse(event.headers.Cookie)
  if (SID === undefined) return response(400, 'SID is undefined')

  const user = await getUser(SID, true)
  if (user === undefined) return response(404, '')

  const subscriptions = (await getSubscriptions(user.token.access_token)).map(subscription => ({
    id: subscription.snippet.resourceId.channelId,
    expiresAt: 0,
    information: {
      publishedAt: subscription.snippet.publishedAt,
      title: subscription.snippet.title,
      description: subscription.snippet.description,
      thumbnails: subscription.snippet.thumbnails
    }
  }))

  const syncedAt = (await updateUserSyncTime(user.email)).valueOf()
  const channels = await syncChannels(user.email, subscriptions)
  const result = {
    syncedAt,
    channels
  }

  return {
    statusCode: 200,
    body: JSON.stringify(result)
  }
}

export const handler = middyfy(post)
