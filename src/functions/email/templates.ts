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

const Html = `
<html>
<div>{{videoId}}</div>
<div>{{videoTitle}}</div>
<div>{{channelId}}</div>
<div>{{channelTitle}}</div>
<div>{{thumbnail}}</div>
<div>{{duration}}</div>
</html>
`

// TODO: make email template
const notification = {
  TemplateName: `${process.env.STAGE}-notification`,
  TemplateContent: {
    Subject: '{{videoTitle}}',
    Text: '[{{duration}}] {{videoTitle}}',
    Html
  }
}

export {
  verification,
  notification
}
