if (process.env.STAGE === undefined) throw new Error('STAGE is undefined')

// TODO: make email template
const verification = {
  FailureRedirectionURL: 'https://naver.com',
  FromEmailAddress: 'noreply@ytfm.app',
  SuccessRedirectionURL: 'https://google.com',
  TemplateName: `${process.env.STAGE}-verification`,
  TemplateSubject: 'Confirm ytfm subscription',
  TemplateContent: 'TODO'
}

// TODO: make email template
const notification = {
  TemplateName: `${process.env.STAGE}-notification`,
  TemplateContent: {
    Subject: '{{videoTitle}}',
    Text: '{{videoTitle}}',
    Html: '{{videoTitle}}'
  }
}

export {
  verification,
  notification
}
