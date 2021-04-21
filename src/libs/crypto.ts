import sodium from 'libsodium-wrappers'
import { getKeys } from '@libs/dynamodb'

async function generateUnsubscribeToken (user: string, channelId: string): Promise<string> {
  await sodium.ready

  const keyResponse = await getKeys('unsubscribe')
  const key = keyResponse.keys[0]

  const random = sodium.randombytes_buf(16, 'base64')
  const message = JSON.stringify({ user, channelId, random })
  return sodium.crypto_secretbox_easy(message, key.nonce, key.key, 'base64')
}

export {
  generateUnsubscribeToken
}
