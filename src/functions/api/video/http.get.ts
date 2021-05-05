import 'source-map-support/register'

import { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import { getVideo } from '@libs/dynamodb'

const getHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const videoId = event.pathParameters?.videoId

  if (videoId === undefined) {
    return response(404)
  }

  const video = await getVideo(videoId)

  if (video === undefined) return response(404)

  return response(200, JSON.stringify(video))
}

export const handler = middyfy(getHandler)
