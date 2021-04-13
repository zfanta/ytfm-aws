import * as sodium from 'libsodium-wrappers'

async function generateEtag (email: string, time: number): Promise<string> {
  await sodium.ready

  return sodium.crypto_generichash(64, `${email}${time}`, null, 'base64')
}

export {
  generateEtag
}
