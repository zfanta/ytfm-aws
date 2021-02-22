import 'source-map-support/register'

import type { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import {
  DynamoDBClient,
  PutItemCommand
} from '@aws-sdk/client-dynamodb'
import isInt from 'validator/lib/isInt'

const client = new DynamoDBClient({
  region: 'us-east-1'
  // endpoint: 'http://localhost:8000'
})

function verifyRequest (event): Query {
  if (event.queryStringParameters === null) throw new Error('Query string is null')

  const query = (event.queryStringParameters as unknown) as Query

  if (query['hub.topic'] === undefined) throw new Error('hub.topic is null')
  if (query['hub.lease_seconds'] === undefined) throw new Error('hub.lease_second is null')
  if (query['hub.challenge'] === undefined) throw new Error('hub.challenge is null')

  if (!isInt(query['hub.lease_seconds'])) throw new Error(`hub.lease_seconds(${query['hub.lease_seconds']}) is not valid`)
  if (!query['hub.topic']?.startsWith('https://www.youtube.com/xml/feeds/videos.xml?channel_id=')) {
    throw new Error(`hub.topic(${query['hub.topic']}) is not valid`)
  }

  return query
}

const get: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  let query
  try {
    query = verifyRequest(event)
  } catch (e) {
    return response(400, e.message)
  }

  const id = query['hub.topic'].replace('https://www.youtube.com/xml/feeds/videos.xml?channel_id=', '')
  const leaseSeconds = query['hub.lease_seconds']
  // const mode = query['hub.mode']

  const currentTime = new Date().valueOf()
  const expiresAt = currentTime + (parseInt(leaseSeconds) * 1000)

  const TableName = process.env.CHANNELS_TABLE_NAME
  const putItemCommand = new PutItemCommand({
    TableName,
    Item: {
      id: { S: id },
      expiresAt: { N: `${expiresAt}` }
    }
  })

  await client.send(putItemCommand)

  return response(200, query['hub.challenge'])
}

export const handler = middyfy(get)

interface Query {
  'hub.topic': string | undefined
  'hub.lease_seconds': string | undefined
  'hub.challenge': string | undefined
}
