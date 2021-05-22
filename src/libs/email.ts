import { SendEmailCommand, SESv2Client } from '@aws-sdk/client-sesv2'
import { parse } from 'iso8601-duration'
import ical, { ICalCalendarMethod } from 'ical-generator'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { VideoFromGoogleApis } from '@libs/types'
import MailComposer from 'nodemailer/lib/mail-composer'
import { IcalAttachment } from 'nodemailer/lib/mailer'
import { generateUnsubscribeToken } from '@libs/crypto'
import { renderToStaticMarkup } from '@libs/EmailTemplate'

// TODO: region name
const client = new SESv2Client({ region: 'us-east-1' })

function getDuration (video: VideoFromGoogleApis): string {
  let duration: string
  let premieres = false

  // https://en.wikipedia.org/wiki/ISO_8601#Durations
  let { hours, minutes, seconds } = parse(video.contentDetails.duration)
  hours ??= 0
  minutes ??= 0
  seconds ??= 0

  const { liveStreamingDetails } = video
  if (liveStreamingDetails !== undefined) {
    if (hours + minutes + seconds === 0) {
      return 'LIVE'
    }
    premieres = true
  }

  duration = `0${seconds}`.slice(-2)
  if (hours !== 0) {
    duration = `${hours}` + ':' + `0${minutes}`.slice(-2) + ':' + duration
  } else {
    duration = `${minutes}` + ':' + duration
  }
  return `${premieres ? 'PREMIERES<br/>' : ''}${duration}`
}

interface Ical {
  start: string|undefined
  duration: string
  summary: string
  url: string
}
function getIcalEvent ({ start, duration, summary, url }: Ical): IcalAttachment|undefined {
  if (start === undefined) return undefined

  let { hours, minutes, seconds } = parse(duration)
  hours ??= 0
  minutes ??= 0
  seconds ??= 0

  if (hours + minutes + seconds === 0) return undefined

  dayjs.extend(utc)

  const calendar = ical({
    method: ICalCalendarMethod.PUBLISH,
    events: [{
      start: dayjs.utc(start),
      end: dayjs.utc(start).add(hours, 'hours').add(minutes, 'minutes').add(seconds, 'seconds'),
      summary,
      url,
      description: {
        plain: summary,
        html: `<html><body><a href="${url}">${summary}</a></body></html>`
      }
    }]
  })

  return {
    content: calendar.toString()
  }
}

async function sendNotificationEmail (notifications: Notification[], channelThumbnail: string, xml: string /* debug */): Promise<Array<PromiseSettledResult<any>>> {
  console.log('sendNotificationEmail =>')
  const promises = notifications.map(async notification => {
    const command = new SendEmailCommand({
      Content: {
        Raw: {
          Data: await getRaw(notification.video, channelThumbnail, notification.subscriber, xml)
        }
      }
    })

    return await client.send(command)
  })

  const result = await Promise.allSettled(promises)
  result.filter(promise => promise.status === 'rejected').forEach(rejected => {
    console.error(rejected)
  })

  console.log('<= sendNotificationEmail')

  return result
}

export {
  sendNotificationEmail
}

interface Notification {
  video: VideoFromGoogleApis
  subscriber: string
}
interface MailData {
  videoTitle: string
  videoLink: string
  thumbnail: {
    width: number
    height: number
    url: string
  }
  duration: string
  channelId: string
  channelTitle: string
  channelThumbnail: string
  description: string
  unsubscribeLink: string
  debug: string
}
async function getRaw (video: VideoFromGoogleApis, channelThumbnail: string, to: string, xml: string /* debug */): Promise<Buffer> {
  if (process.env.STAGE === undefined) throw new Error('STAGE is undefined')

  const largestThumbnail = Object.keys(video.snippet.thumbnails).sort((a, b) => {
    if (video.snippet.thumbnails[a].width < video.snippet.thumbnails[b].width) {
      return 1
    } else {
      return -1
    }
  })[0]

  const channelId = video.snippet.channelId
  const unsubscribeToken = await generateUnsubscribeToken(to, channelId)
  const unsubscribeLink = `https://${process.env.STAGE}.ytfm.app/subscriptions/${channelId}?token=${unsubscribeToken}&action=unsubscribe`
  const videoLink = video.status.embeddable && video.contentDetails.contentRating.ytRating !== 'ytAgeRestricted'
    ? `https://${process.env.STAGE}.ytfm.app/watch/${video.id}`
    : `https://www.youtube.com/watch?v=${video.id}`

  const duration = getDuration(video)

  const icalEvent = getIcalEvent({
    start: video.liveStreamingDetails?.scheduledStartTime ?? video.liveStreamingDetails?.actualStartTime,
    duration: video.contentDetails.duration,
    url: videoLink,
    summary: video.snippet.title
  })

  const mail = new MailComposer({
    from: {
      address: 'noreply@ytfm.app',
      name: video.snippet.channelTitle
    },
    to,
    headers: {
      'List-Unsubscribe': `<${unsubscribeLink}>`
    },
    subject: video.snippet.title,
    text: `[${duration}] ${video.snippet.title}`,
    html: getHtml({
      videoLink,
      videoTitle: video.snippet.title,
      channelId: video.snippet.channelId,
      channelTitle: video.snippet.channelTitle,
      channelThumbnail,
      thumbnail: video.snippet.thumbnails[largestThumbnail],
      duration,
      description: video.snippet.description
        .replace(/#([^\s^#]+)/g, '<a href="https://www.youtube.com/hashtag/$1">#$1</a>')
        .replace(/\n/g, '<br/>'),
      unsubscribeLink,
      debug: JSON.stringify({ video, xml })
    }),
    icalEvent
  })
  return await mail.compile().build()
}

function getHtml (data: MailData): string {
  if (process.env.STAGE === undefined) throw new Error('STAGE is undefined')

  const markup = renderToStaticMarkup(data)

  return `<html><body>${markup}</body></html>`
}
