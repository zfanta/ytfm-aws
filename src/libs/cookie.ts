import 'source-map-support/register'

import { deleteSession, getSession, putSession } from '@libs/dynamodb'
import { nanoid } from 'nanoid/async'

async function generateSid (): Promise<string> {
  while (true) {
    const SID = await nanoid(64)

    const item = await getSession(SID)

    if (item === undefined) {
      return SID
    }
  }
}

async function refresh (sidFromClient: string): Promise<string> {
  const newSID = await generateSid()

  // Cookie validation
  const session = await getSession(sidFromClient)
  if (session === undefined) {
    return await createSession(newSID)
  }

  await deleteSession(sidFromClient)

  await putSession(newSID, session.user, session.data)

  return newSID
}

async function createSession (SID?: string): Promise<string> {
  if (SID === undefined) {
    SID = await generateSid()
  }
  await putSession(SID, 'empty')
  return SID
}

export {
  refresh,
  createSession
}
