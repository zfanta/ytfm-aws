import 'source-map-support/register'

import { createLogger, format, transports } from 'winston'
import type { Logger } from 'winston'
import { TransformableInfo } from 'logform'
const { combine, timestamp, printf, label } = format

const myFormat = printf((info) => {
  const { level, label, message, timestamp } = info as TransformableInfo & {label: string, timestamp: string}
  return `[${timestamp}][${level[0].toUpperCase()}][${label}]${message}`
})

export default function (name: string): Logger {
  return createLogger({
    level: 'info',
    format: combine(
      timestamp(),
      label({ label: name }),
      myFormat
    ),
    transports: [
      new transports.Console({})
    ]
  })
}
