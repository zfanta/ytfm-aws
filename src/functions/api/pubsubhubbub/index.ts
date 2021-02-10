const pubsubhubbubHttpGet = {
  handler: 'src/functions/api/pubsubhubbub/http.get',
  events: [{
    http: {
      method: 'get',
      path: 'api/pubsubhubbub',
      request: {
        parameters: {
          querystrings: {
            'hub.topic': true,
            'hub.challenge': true,
            'hub.mode': true,
            'hub.lease_seconds': true
          }
        }
      }
    }
  }]
}

const pubsubhubbubSend = {
  handler: 'src/functions/api/pubsubhubbub/send.handler',
  events: [{
    sqs: {
      arn: {
        // eslint-disable-next-line no-template-curly-in-string
        'Fn::GetAtt': ['pubsubhubbubQueue', 'Arn']
      }
    }
  }]
}

export default {
  pubsubhubbubHttpGet,
  pubsubhubbubSend
}
