import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import { get as getCookie, updateUser } from '@libs/cookie'
import { getEmail, getTokenFromGoogle, updateGoogleToken } from '@libs/oauth2'

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

  // TODO: reuse
  // const channels = await getSubscriptions(token.access_token)
  // await setSubscription(email, channels)
  // try {
  //   await pubsubhubbub('subscribe', channels)
  //   await pushVerificationEmail(email)
  // } catch (e) {
  //   return {
  //     statusCode: 503,
  //     body: e.message
  //   }
  // }

  return {
    statusCode: 303,
    headers: {
      Location: '/subscriptions'
    },
    body: ''
  }
}

export const handler = middyfy(get)
