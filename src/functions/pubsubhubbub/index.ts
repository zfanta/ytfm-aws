const obj = {
  handler: 'src/functions/pubsubhubbub/send.main',
  events: [{
    sqs: {
      arn: {
        // eslint-disable-next-line no-template-curly-in-string
        'Fn::GetAtt': ['pubsubhubbubQueue', 'Arn']
      }
    }
  }]
}

export default obj
