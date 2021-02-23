import 'source-map-support/register'

import { DynamoDBClient, QueryCommand } from '@aws-sdk/client-dynamodb'

// TODO: region
const client = new DynamoDBClient({ region: 'us-east-1' })

async function getSubscriptions (user: string, ExclusiveStartKey?: any): Promise<Array<{channel: string, enabled: boolean}>> {
  const command = new QueryCommand({
    TableName: process.env.SUBSCRIPTIONS_TABLE_NAME,
    IndexName: 'user-idx',
    KeyConditionExpression: '#user = :user',
    ExpressionAttributeNames: { '#user': 'user' },
    ExpressionAttributeValues: { ':user': { S: user } },
    ExclusiveStartKey
  })

  const response = await client.send(command)
  const items = response.Items?.map(item => ({
    channel: item.channel.S as string,
    enabled: item.enabled.BOOL as boolean
  })) ?? []

  if (response.LastEvaluatedKey === undefined) return items

  return [...items, ...await getSubscriptions(user, response.LastEvaluatedKey)]
}

export {
  getSubscriptions
}
