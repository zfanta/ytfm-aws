import { SQSHandler } from 'aws-lambda'
import qs from 'querystring'
import fetch from 'node-fetch'

async function sendToPubsubhubbub (channelId: string, mode: string): Promise<void> {
  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
  const body = {
    // 'hub.lease_seconds': 10,
    'hub.callback': 'https://dev.ytfm.app/pubsubhubbub',
    'hub.mode': mode,
    'hub.topic': `https://www.youtube.com/xml/feeds/videos.xml?channel_id=${channelId}`,
    'hub.verify': 'async'
    // 'hub.secret': APP_SECRET_KEY
  }
  await fetch('https://pubsubhubbub.appspot.com/', {
    method: 'post',
    headers,
    body: qs.stringify(body)
  })
}

const main: SQSHandler = async (event) => {
  console.log('Pubsubhubbub send =>')

  await Promise.all(event.Records.map(async record => {
    const channelId = record.messageAttributes.channelId.stringValue
    const mode = record.messageAttributes.mode.stringValue

    if (channelId === undefined) throw new Error('Channel id is undefined')
    if (mode === undefined) throw new Error('mode id is undefined')

    return await sendToPubsubhubbub(channelId, mode)
  }))

  console.log('<= Pubsubhubbub send')
}

export {
  main
}
