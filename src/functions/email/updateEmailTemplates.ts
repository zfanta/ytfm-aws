import 'source-map-support/register'

import { Handler } from 'aws-lambda'
import {
  SESv2Client,
  CreateCustomVerificationEmailTemplateCommand,
  DeleteCustomVerificationEmailTemplateCommand,
  CreateEmailTemplateCommand,
  DeleteEmailTemplateCommand
} from '@aws-sdk/client-sesv2'
import createLogger from '@libs/createLogger'
import * as templates from './templates'

const logger = createLogger('/email/updateEmailTemplates.ts')

// TODO: region
const client = new SESv2Client({ region: 'us-east-1' })

async function deleteTemplates (): Promise<void> {
  try {
    logger.info(`Delete ${templates.verification.TemplateName}`)
    await client.send(new DeleteCustomVerificationEmailTemplateCommand({ TemplateName: templates.verification.TemplateName }))

    logger.info(`Delete ${templates.notification.TemplateName}`)
    await client.send(new DeleteEmailTemplateCommand({ TemplateName: templates.notification.TemplateName }))
  } catch (e) {
    logger.error(e)
  }
}

async function createCustomVerificationEmailTemplate (): Promise<void> {
  logger.info(`Create ${templates.verification.TemplateName}`)
  const command = new CreateCustomVerificationEmailTemplateCommand(templates.verification)

  await client.send(command)
}

async function createNotificationEmailTemplate (): Promise<void> {
  logger.info(`Create ${templates.notification.TemplateName}`)
  const command = new CreateEmailTemplateCommand(templates.notification)

  await client.send(command)
}

const handler: Handler = async () => {
  logger.debug('=>')

  await deleteTemplates()

  await createCustomVerificationEmailTemplate()

  await createNotificationEmailTemplate()

  logger.debug('<=')
}

export {
  handler
}
