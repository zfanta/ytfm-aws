import { AttributeValue } from '@aws-sdk/client-dynamodb/models/models_0'
import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb'

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

export {
  get,
  updateUser
}
