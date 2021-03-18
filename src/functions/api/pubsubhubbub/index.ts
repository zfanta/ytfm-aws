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
  pubsubhubbubResubscribe
}
