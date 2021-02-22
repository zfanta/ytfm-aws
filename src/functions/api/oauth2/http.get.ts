import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy } from '@libs/lambda'
import fetch from 'node-fetch'
import { URLSearchParams } from 'url'
import {
  DynamoDBClient,
  PutItemCommand,
  GetItemCommand
} from '@aws-sdk/client-dynamodb'
import * as qs from 'querystring'
import { get as getCookie, updateUser } from '@libs/cookie'

const client = new DynamoDBClient({
  // TODO: region
  region: 'us-east-1'
})

function response (statusCode: number, body: string): {statusCode: number, body: string} {
  return { statusCode, body }
}

async function updateGoogleToken (email: string, token: Token): Promise<void> {
  const TableName = process.env.USERS_TABLE_NAME

  let newToken = token

  const getItemCommand = new GetItemCommand({
    TableName,
    Key: { email: { S: email } }
  })

  const result = await client.send(getItemCommand)
  if (result?.Item?.token?.S !== undefined) {
    const oldToken = JSON.parse(result.Item.token.S)
    newToken = Object.assign({}, oldToken, token)
  }

  const currentTime = new Date().valueOf()
  const expiresAt = currentTime + (token.expires_in * 1000)

  const putItemCommand = new PutItemCommand(({
    TableName,
    Item: {
      email: { S: email },
      token: { S: JSON.stringify(newToken) },
      expiresAt: { N: `${expiresAt}` }
    }
  }))

  await client.send(putItemCommand)
}

async function getToken (code: string): Promise<Token> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH2_REDIRECT_URL } = process.env
  if (GOOGLE_CLIENT_ID === undefined) throw new Error('GOOGLE_CLIENT_ID is undefined')
  if (GOOGLE_CLIENT_SECRET === undefined) throw new Error('GOOGLE_CLIENT_SECRET is undefined')
  if (OAUTH2_REDIRECT_URL === undefined) throw new Error('OAUTH2_REDIRECT_URL is undefined')

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  const urlencoded = new URLSearchParams()
  urlencoded.append('code', code)
  urlencoded.append('client_id', GOOGLE_CLIENT_ID)
  urlencoded.append('client_secret', GOOGLE_CLIENT_SECRET)
  urlencoded.append('redirect_uri', OAUTH2_REDIRECT_URL)
  urlencoded.append('grant_type', 'authorization_code')

  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded
  }

  return await fetch('https://accounts.google.com/o/oauth2/token', requestOptions)
    .then(async response => await response.json())
}

async function getEmail (accessToken: string): Promise<string> {
  const query = qs.stringify({
    access_token: accessToken
  })

  const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?${query}`).then(async response => await response.json())
  return response.email
}

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
    token = await getToken(code)
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

interface Token {
  'access_token': string
  'token_type': 'Bearer'
  'expires_in': number
  'refresh_token'?: string
  'scope': string
  'error'?: string
  'error_description'?: string
}
