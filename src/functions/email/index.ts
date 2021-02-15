const updateEmailTemplates = {
  handler: 'src/functions/email/updateEmailTemplates.handler'
}

const sendEmail = {
  handler: 'src/functions/email/send.handler',
  events: [{
    sqs: {
      arn: {
        // eslint-disable-next-line no-template-curly-in-string
        'Fn::GetAtt': ['emailQueue', 'Arn']
      }
    }
  }]
}

export default {
  updateEmailTemplates,
  sendEmail
}
