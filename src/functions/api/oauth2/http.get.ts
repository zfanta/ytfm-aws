import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import { get as getCookie, updateUser } from '@libs/cookie'
import { getEmail, getTokenFromGoogle } from '@libs/oauth2'
import { updateGoogleToken } from '@libs/dynamodb'

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
  const { SID } = parseState(state)
  if (SID === undefined) return response(400, 'SID is undefined')

  // Check cookie
  if (await getCookie(SID) === undefined) return response(400, 'Cookie is invalid')

  let token
  try {
    token = await getTokenFromGoogle(code)
  } catch (e) {
    return response(503, e.message)
  }

  if (token.error !== undefined) {
    return {
      statusCode: 403,
      body: JSON.stringify(token)
    }
  }

  const email = await getEmail(token.access_token)

  await Promise.all([
    updateGoogleToken(email, token),
    updateUser(SID, email)
  ])

  return {
    statusCode: 303,
    headers: {
      Location: '/subscriptions'
    },
    body: ''
  }
}

export const handler = middyfy(get)
