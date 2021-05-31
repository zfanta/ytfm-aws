import { sendToPubsubhubbub } from '@libs/youtube'
import { pubsubhubbub as pubsubhubbubQueue } from '@libs/sqs'

const main = async (): Promise<void> => {
  console.log('Pubsubhubbub request =>')

  const record = await pubsubhubbubQueue.receive()

  if (record === undefined) return

  if (record.Body === undefined) throw new Error('Body is undefined')

  const body = JSON.parse(record.Body) as {channelId: string, mode: 'subscribe'|'unsubscribe'}

  const { channelId, mode } = body

  if (mode !== 'subscribe' && mode !== 'unsubscribe') throw new Error(`mode is ${mode as string}`)

  try {
    const response = await sendToPubsubhubbub(channelId, mode)
    if (!(response.status >= 200 && response.status < 300)) {
      console.error(response)
      await pubsubhubbubQueue.send([channelId])
    }
  } catch (e) {
    console.error(e)
    await pubsubhubbubQueue.send([channelId])
  }

  console.log('<= Pubsubhubbub request')
}

export {
  main
}
