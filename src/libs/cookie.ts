import 'source-map-support/register'

import { Token } from '@libs/types'
import { refreshToken } from '@libs/oauth2'
import { deleteSession, getSession, getUser as getUserFromDB, putSession, updateGoogleToken } from '@libs/dynamodb'
import { nanoid } from 'nanoid/async'

async function getUser (SID: string, refreshTokenIfExpired: boolean = false): Promise<User|undefined> {
  const cookie = await getSession(SID)
  if (cookie === undefined) return undefined

  const email = cookie.user
  if (email === undefined) return undefined

  const user = await getUserFromDB(email)
  if (user === undefined) return undefined

  let token = user.token
  // Refresh token if expired
  if (refreshTokenIfExpired) {
    const currentTime = new Date()
    if (user.expiresAt < currentTime.valueOf()) {
      const newToken = await refreshToken(token.refresh_token as string)
      token = await updateGoogleToken(email, newToken)
    }
  }

  return {
    email,
    token,
    syncedAt: user.syncedAt
  }
}

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
  getUser,
  refresh,
  createSession
}

interface User {
  email: string
  token: Token
  syncedAt?: number
}
