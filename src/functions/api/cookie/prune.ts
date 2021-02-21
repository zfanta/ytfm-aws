import { EventBridgeHandler } from 'aws-lambda'
import { DynamoDBClient, ScanCommand, BatchWriteItemCommand, DeleteRequest, QueryCommand } from '@aws-sdk/client-dynamodb'
import dayjs from 'dayjs'

const TableName = process.env.SESSIONS_TABLE_NAME
if (TableName === undefined) throw new Error('SESSIONS_TABLE_NAME is undefined')

// TODO: region
const client = new DynamoDBClient({ region: 'us-east-1' })

async function getExpired (ExclusiveStartKey?: any): Promise<string[]> {
  const command = new ScanCommand({
    TableName,
    IndexName: 'expiresAt-idx',
    FilterExpression: '#expiresAt <= :expiresAt',
    ExpressionAttributeNames: { '#expiresAt': 'expiresAt' },
    ExpressionAttributeValues: { ':expiresAt': { N: `${new Date().valueOf()}` } },
    ExclusiveStartKey
  })

  const result = await client.send(command)
  const expired = result.Items?.map(item => item.id.S as string) ?? []

  if (result.LastEvaluatedKey === undefined) return expired

  return [...expired, ...await getExpired(result.LastEvaluatedKey)]
}

// 1 month
async function getColdEmpties (ExclusiveStartKey?: any): Promise<string[]> {
  const command = new QueryCommand({
    TableName,
    IndexName: 'empty-idx',
    KeyConditionExpression: '#user = :empty AND #atime < :atime',
    ExpressionAttributeNames: {
      '#user': 'user',
      '#atime': 'atime'
    },
    ExpressionAttributeValues: {
      ':empty': { S: 'empty' },
      ':atime': { N: `${dayjs().subtract(1, 'month').toDate().valueOf()}` }
    },
    ExclusiveStartKey
  })

  const result = await client.send(command)
  const ids = result.Items?.map(item => item.id.S as string) ?? []

  if (result.LastEvaluatedKey === undefined) return ids

  return [...ids, ...await getColdEmpties(result.LastEvaluatedKey)]
}

async function deleteCookies (ids: string[]): Promise<void> {
  if (TableName === undefined) throw new Error('SESSIONS_TABLE_NAME is undefined')

  // 25 limit
  const requests: Array<Array<{DeleteRequest: DeleteRequest}>> = []
  for (let i = 0; i < ids.length; i += 25) {
    requests.push(ids.slice(i, i + 25).map(id => ({
      DeleteRequest: {
        Key: { id: { S: id } }
      }
    })))
  }

  await Promise.all(requests.map(async request => {
    const command = new BatchWriteItemCommand({
      RequestItems: {
        [TableName]: request
      }
    })

    await client.send(command)
  }))
}

const handler: EventBridgeHandler<any, any, any> = async () => {
  const expired = await getExpired()
  const coldEmpties = await getColdEmpties()

  await deleteCookies([...expired, ...coldEmpties])
}

export { handler }
