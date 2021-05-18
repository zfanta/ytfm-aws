import 'source-map-support/register'

import { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response, injectUser } from '@libs/lambda'
import { getRegions, setRegions } from '@libs/dynamodb'
import { getRegions as getRegionsFromYoutube } from '@libs/youtube'

const getHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const language = event.pathParameters?.language ?? 'en-US'
  const IfNoneMatch = event.headers['If-None-Match']

  let regions, etag
  const regionsFromDB = (await getRegions(language))

  if (IfNoneMatch !== undefined) {
    const responseFromYoutube = await getRegionsFromYoutube(language, IfNoneMatch)

    if (responseFromYoutube === 'Not Modified') return response(304)

    etag = responseFromYoutube.etag
    regions = responseFromYoutube.items.map(region => ({
      id: region.id,
      name: region.snippet.name
    }))
    await setRegions(language, etag, regions)

    return response(200, JSON.stringify(regions))
  }

  if (regionsFromDB === undefined) {
    const response = await getRegionsFromYoutube(language)
    etag = response.etag
    regions = response.items.map(region => ({
      id: region.id,
      name: region.snippet.name
    }))
    await setRegions(language, etag, regions)
  } else {
    regions = regionsFromDB.regions
    etag = regionsFromDB.etag

    const response = await getRegionsFromYoutube(language, etag)
    if (response !== 'Not Modified') {
      etag = response.etag
      regions = response.items.map(region => ({
        id: region.id,
        name: region.snippet.name
      }))
      await setRegions(language, etag, regions)
    }
  }

  return response(200, JSON.stringify(regions), { Etag: etag })
}

export const handler = middyfy(injectUser(getHandler))
