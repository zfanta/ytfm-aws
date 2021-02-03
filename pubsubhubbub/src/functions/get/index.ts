const obj = {
  handler: 'src/functions/get/handler.main',
  events: [{
    http: {
      method: 'get',
      path: 'pubsubhubbub',
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

export default obj
