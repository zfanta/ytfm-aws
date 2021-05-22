import 'source-map-support/register'

import { Feed } from 'feed'
import { ValidatedEventAPIGatewayProxyEvent } from '@libs/apiGateway'
import { middyfy, response } from '@libs/lambda'
import { getChannel as getChannelFromDB, getVideosInChannel } from '@libs/dynamodb'
import { getChannel as getChannelFromYoutube, sendToPubsubhubbub } from '@libs/youtube'
import { renderToStaticMarkup } from '@libs/EmailTemplate'
import { getDuration } from '@libs/email'

const getHandler: ValidatedEventAPIGatewayProxyEvent<any> = async (event) => {
  const STAGE = process.env.STAGE
  if (STAGE === undefined) return response(500, 'STAGE is undefined')

  const channelId = event.pathParameters?.channelId

  if (channelId === undefined) {
    return response(400)
  }

  const channel = await getChannelFromDB(channelId)

  if (channel === undefined) {
    const channelFromYoutube = await getChannelFromYoutube(channelId)

    if (channelFromYoutube === undefined) return response(404)

    await sendToPubsubhubbub([channelId], 'subscribe')

    const feed = new Feed({
      title: channelFromYoutube.snippet.title,
      description: channelFromYoutube.snippet.description,
      id: `https://www.youtube.com/channel/${channelId}`,
      copyright: '',
      link: `https://www.youtube.com/channel/${channelId}`
    })

    return response(200, feed.rss2())
  }

  const videos = await getVideosInChannel(channelId)

  const feed = new Feed({
    title: channel.information.title,
    description: channel.information.description,
    id: `https://www.youtube.com/channel/${channelId}`,
    copyright: '',
    link: `https://www.youtube.com/channel/${channelId}`
  })

  const channelThumbnail = Object.keys(channel.information.thumbnails).sort((a, b) => {
    if (channel.information.thumbnails[a].width < channel.information.thumbnails[b].width) {
      return 1
    } else {
      return -1
    }
  })[0]

  videos.forEach(video => {
    const link = `https://${STAGE}.ytfm.app/watch/${video.id}`
    const thumbnailKey = Object.keys(video.snippet.thumbnails).sort((a, b) => {
      if (video.snippet.thumbnails[a].width < video.snippet.thumbnails[b].width) {
        return 1
      } else {
        return -1
      }
    })[0]

    feed.addItem({
      title: video.snippet.title,
      id: link,
      link,
      date: new Date(video.snippet.publishedAt),
      // TODO
      content: renderToStaticMarkup({
        videoLink: link,
        debug: undefined,
        unsubscribeLink: undefined,
        channelTitle: channel.information.title,
        thumbnail: video.snippet.thumbnails[thumbnailKey],
        duration: getDuration(video),
        videoTitle: video.snippet.title,
        channelId: channel.id,
        channelThumbnail,
        description: video.snippet.description
          .replace(/#([^\s^#]+)/g, '<a href="https://www.youtube.com/hashtag/$1">#$1</a>')
          .replace(/\n/g, '<br/>')
      })
    })
  })

  return response(200, feed.rss2())
}

export const handler = middyfy(getHandler)
