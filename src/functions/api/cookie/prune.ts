import { EventBridgeHandler } from 'aws-lambda'
import { deleteSessions, getExpiredSessions, getOldEmptySessions } from '@libs/dynamodb'

const TableName = process.env.SESSIONS_TABLE_NAME
if (TableName === undefined) throw new Error('SESSIONS_TABLE_NAME is undefined')

const handler: EventBridgeHandler<any, any, any> = async () => {
  const expired = await getExpiredSessions()
  const coldEmpties = await getOldEmptySessions()

  await deleteSessions([...expired, ...coldEmpties])
}

export { handler }
