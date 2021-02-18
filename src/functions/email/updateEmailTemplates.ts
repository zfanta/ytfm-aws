import 'source-map-support/register'

import { Handler } from 'aws-lambda'
import {
  SESv2Client,
  CreateCustomVerificationEmailTemplateCommand,
  DeleteCustomVerificationEmailTemplateCommand,
  CreateEmailTemplateCommand,
  DeleteEmailTemplateCommand
} from '@aws-sdk/client-sesv2'
import * as templates from './templates'

// TODO: region
const client = new SESv2Client({ region: 'us-east-1' })

async function deleteTemplates (): Promise<void> {
  try {
    console.log(`Delete ${templates.verification.TemplateName}`)
    await client.send(new DeleteCustomVerificationEmailTemplateCommand({ TemplateName: templates.verification.TemplateName }))

    console.log(`Delete ${templates.notification.TemplateName}`)
    await client.send(new DeleteEmailTemplateCommand({ TemplateName: templates.notification.TemplateName }))
  } catch (e) {
    console.log(e)
  }
}

async function createCustomVerificationEmailTemplate (): Promise<void> {
  console.log(`Create ${templates.verification.TemplateName}`)
  const command = new CreateCustomVerificationEmailTemplateCommand(templates.verification)

  await client.send(command)
}

async function createNotificationEmailTemplate (): Promise<void> {
  console.log(`Create ${templates.notification.TemplateName}`)
  const command = new CreateEmailTemplateCommand(templates.notification)

  await client.send(command)
}

const handler: Handler = async () => {
  console.log('UpdateEmailTemplates =>')

  await deleteTemplates()

  await createCustomVerificationEmailTemplate()

  await createNotificationEmailTemplate()

  console.log('<= UpdateEmailTemplates')
}

export {
  handler
}
