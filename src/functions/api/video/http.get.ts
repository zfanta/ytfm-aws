import 'source-map-support/register'

import { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import { getVideo, putVideo } from '@libs/dynamodb'
import { getVideoInformation } from '@libs/youtube'

const getHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const videoId = event.pathParameters?.videoId

  if (videoId === undefined) {
    return response(400)
  }

  let video = await getVideo(videoId)

  if (video === undefined) {
    video = await getVideoInformation(videoId)

    if (video === undefined) {
      return response(404)
    }

    await putVideo(video)
  }

  return response(200, JSON.stringify(video))
}

export const handler = middyfy(getHandler)
