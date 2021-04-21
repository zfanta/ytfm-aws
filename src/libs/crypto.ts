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

interface UnsubscribeData {
  user: string
  channelId: string
}
async function decryptUnsubscribeToken (token: string): Promise<UnsubscribeData|undefined> {
  await sodium.ready

  let ExcludeStartKey
  do {
    const keyResponse = await getKeys('unsubscribe', ExcludeStartKey)
    for (const key of keyResponse.keys) {
      try {
        const decrypted = sodium.crypto_secretbox_open_easy(sodium.from_base64(token), key.nonce, key.key, 'text')
        return JSON.parse(decrypted)
      } catch (e) {
      }
    }
    ExcludeStartKey = keyResponse.ExclusiveStartKey
  } while (ExcludeStartKey !== undefined)

  return undefined
}

export {
  generateUnsubscribeToken,
  decryptUnsubscribeToken
}
