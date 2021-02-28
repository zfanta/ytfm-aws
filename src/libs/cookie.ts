import 'source-map-support/register'

import { AttributeValue } from '@aws-sdk/client-dynamodb/models/models_0'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'
import { Token } from '@libs/types'
import { refreshToken } from '@libs/oauth2'
import { updateGoogleToken } from '@libs/dynamodb'

const client = new DynamoDBClient({
  // TODO: region
  region: 'us-east-1'
})

const TableName = process.env.SESSIONS_TABLE_NAME

async function get (SID: string): Promise<{[key: string]: AttributeValue}|undefined> {
  const command = new GetItemCommand({
    TableName,
    ConsistentRead: true,
    Key: {
      id: { S: SID }
    }
  })

  const result = await client.send(command)
  return result.Item
}

async function updateUser (SID: string, user: string): Promise<void> {
  const command = new UpdateItemCommand({
    TableName,
    Key: { id: { S: SID } },
    UpdateExpression: 'SET #user = :user',
    ExpressionAttributeNames: { '#user': 'user' },
    ExpressionAttributeValues: { ':user': { S: user } }
  })

  await client.send(command)
}

async function getUser (SID: string, refreshTokenIfExpired: boolean = false): Promise<User|undefined> {
  const cookie = await get(SID)
  if (cookie === undefined) return undefined

  const email = cookie.user.S
  if (email === undefined) return undefined

  const command = new GetItemCommand({
    TableName: process.env.USERS_TABLE_NAME,
    Key: { email: { S: email } }
  })

  const user = await client.send(command)
  if (user.Item === undefined) return undefined
  if (user.Item.email.S === undefined) return undefined
  if (user.Item.expiresAt.N === undefined) return undefined
  if (user.Item.token.S === undefined) return undefined

  let token: Token = JSON.parse(user.Item.token.S)

  // Refresh token if expired
  if (refreshTokenIfExpired) {
    const currentTime = new Date()
    if (parseInt(user.Item.expiresAt.N) < currentTime.valueOf()) {
      const newToken = await refreshToken(token.refresh_token as string)
      token = await updateGoogleToken(email, newToken)
    }
  }

  return {
    email,
    token,
    syncedAt: user.Item.syncedAt?.N !== undefined ? parseInt(user.Item.syncedAt.N) : undefined
  }
}

export {
  get,
  updateUser,
  getUser
}

interface User {
  email: string
  token: Token
  syncedAt?: number
}
