const subscriptionsHttpGet = {
  handler: 'src/functions/api/subscriptions/http.get',
  events: [{
    http: {
      cors: true,
      method: 'get',
      path: 'api/subscriptions'
    }
  }, {
    http: {
      cors: true,
      method: 'get',
      path: 'api/subscriptions/{channelId}'
    }
  }]
}

const subscriptionsHttpPost = {
  handler: 'src/functions/api/subscriptions/http.post',
  events: [{
    http: {
      cors: true,
      method: 'post',
      path: 'api/subscriptions'
    }
  }]
}

const subscriptionsHttpPatch = {
  handler: 'src/functions/api/subscriptions/http.patch',
  events: [{
    http: {
      cors: true,
      method: 'patch',
      path: 'api/subscriptions/{channelId}'
    }
  }]
}

export default {
  subscriptionsHttpGet,
  subscriptionsHttpPost,
  subscriptionsHttpPatch
}
