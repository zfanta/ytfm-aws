import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import { getEmail, getPhotos, getTokenFromGoogle } from '@libs/oauth2'
import { getSession, updateGoogleTokenAndPhotos, updateSessionUser } from '@libs/dynamodb'

function parseState (state: string): any {
  const result = {}

  state
    .split('&')
    .filter(state => state !== '')
    .map(states => states.split('='))
    .forEach(state => {
      result[state[0]] = state[1]
    })

  return result
}

const get: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const code = event.queryStringParameters?.code
  if (code === undefined) return response(400, 'code is undefined')
  const state = event.queryStringParameters?.state
  if (state === undefined) return response(400, 'state is undefined')
  const { SID, REDIRECT_URI } = parseState(state)
  if (SID === undefined) return response(400, 'SID is undefined')

  if (REDIRECT_URI === undefined) return response(400, 'REDIRECT_URI is invalid')

  // Check cookie
  if (await getSession(SID) === undefined) return response(400, 'Cookie is invalid')

  let token
  try {
    token = await getTokenFromGoogle(code, REDIRECT_URI)
  } catch (e) {
    return response(503, e.message)
  }

  if (token.error !== undefined) {
    return {
      statusCode: 401,
      body: JSON.stringify(token)
    }
  }

  const email = await getEmail(token.access_token)
  const photos = await getPhotos(token.access_token)

  await Promise.all([
    updateGoogleTokenAndPhotos(email, undefined, token, photos),
    updateSessionUser(SID, email)
  ])

  return {
    statusCode: 303,
    headers: {
      Location: '/'
    },
    body: ''
  }
}

export const handler = middyfy(get)
