import 'source-map-support/register'

import { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy } from '@libs/lambda'
import { nanoid } from 'nanoid/async'
import {
  DynamoDBClient,
  PutItemCommand,
  DeleteItemCommand
} from '@aws-sdk/client-dynamodb'
import cookie from 'cookie'
import dayjs from 'dayjs'
import { get as getCookie } from '@libs/cookie'

const TableName = process.env.SESSIONS_TABLE_NAME

const client = new DynamoDBClient({
  // TODO: region
  region: 'us-east-1'
})

async function refresh (sidFromClient: string): Promise<string> {
  const SID = await generateSid()

  // Cookie validation
  const item = await getCookie(sidFromClient)
  if (item === undefined) {
    await put(SID, 'empty')
    return SID
  }

  const deleteItemCommand = new DeleteItemCommand({
    TableName,
    Key: {
      id: { S: sidFromClient }
    }
  })

  if (item.user.S === undefined) throw new Error('item.user.S is undefined')

  await put(SID, item.user.S, item.data?.S)
  await client.send(deleteItemCommand)

  return SID
}

async function generateSid (): Promise<string> {
  while (true) {
    const SID = await nanoid(64)

    const item = await getCookie(SID)

    if (item === undefined) {
      return SID
    }
  }
}

async function put (SID: string, user: string, data?: string): Promise<void> {
  const Item = {
    id: { S: SID },
    user: { S: user },
    atime: { N: `${new Date().valueOf()}` },
    expiresAt: { N: `${dayjs().add(1, 'year').toDate().valueOf()}` }
  }
  if (data !== undefined) {
    Object.assign(Item, {
      data: { S: data }
    })
  }

  const putItemCommand = new PutItemCommand(({
    TableName,
    Item
  }))

  await client.send(putItemCommand)
}

const getHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const cookies = event.headers?.Cookie !== undefined ? cookie.parse(event.headers.Cookie) : undefined

  let SID: string

  if (cookies?.SID !== undefined) {
    SID = await refresh(cookies.SID)
  } else {
    SID = await generateSid()
    await put(SID, 'empty')
  }

  const nextYear = 60 * 60 * 24 * 365

  return {
    body: '',
    statusCode: 200,
    headers: {
      'Set-Cookie': `SID=${SID}; Max-age=${nextYear}; Path=/`
    }
  }
}

export const handler = middyfy(getHandler)
