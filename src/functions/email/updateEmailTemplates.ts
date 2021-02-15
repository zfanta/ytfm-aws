import 'source-map-support/register'

import { Handler } from 'aws-lambda'
import {
  SESv2Client,
  CreateCustomVerificationEmailTemplateCommand,
  DeleteCustomVerificationEmailTemplateCommand,
  CreateEmailTemplateCommand,
  DeleteEmailTemplateCommand
} from '@aws-sdk/client-sesv2'

// TODO: region
const client = new SESv2Client({ region: 'us-east-1' })

async function deleteTemplates (): Promise<void> {
  try {
    console.log('Delete verification')
    await client.send(new DeleteCustomVerificationEmailTemplateCommand({ TemplateName: 'verification' }))

    console.log('Delete ytfm')
    await client.send(new DeleteEmailTemplateCommand({ TemplateName: 'ytfm' }))
  } catch (e) {
    console.log(e)
  }
}

// TODO: make email template
async function createCustomVerificationEmailTemplate (): Promise<void> {
  const command = new CreateCustomVerificationEmailTemplateCommand({
    FailureRedirectionURL: 'https://naver.com',
    FromEmailAddress: 'noreply@ytfm.app',
    SuccessRedirectionURL: 'https://google.com',
    TemplateName: 'verification',
    TemplateSubject: 'Confirm ytfm subscription',
    TemplateContent: 'TODO'
  })

  await client.send(command)
}

// TODO: make email template
async function createEmailTemplate (): Promise<void> {
  const command = new CreateEmailTemplateCommand({
    TemplateName: 'ytfm',
    TemplateContent: {
      Subject: '[YTFM] {{channelName}}',
      Text: '{{title}}',
      Html: '{{title}}'
    }
  })

  await client.send(command)
}

const handler: Handler = async () => {
  console.log('UpdateEmailTemplates =>')

  await deleteTemplates()

  await createCustomVerificationEmailTemplate()

  await createEmailTemplate()

  console.log('<= UpdateEmailTemplates')
}

export {
  handler
}
