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

const pubsubhubbubHttpPost = {
  handler: 'src/functions/api/pubsubhubbub/http.post',
  events: [{
    http: {
      method: 'post',
      path: 'api/pubsubhubbub'
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

const pubsubhubbubResubscribe = {
  handler: 'src/functions/api/pubsubhubbub/resubscribe.handler',
  events: [{
    eventBridge: {
      schedule: 'rate(1 hour)'
    }
  }]
}

export default {
  pubsubhubbubHttpGet,
  pubsubhubbubHttpPost,
  pubsubhubbubSend,
  pubsubhubbubResubscribe
}
