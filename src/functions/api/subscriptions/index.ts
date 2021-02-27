const subscriptionsHttpGet = {
  handler: 'src/functions/api/subscriptions/http.get',
  events: [{
    http: {
      method: 'get',
      path: 'api/subscriptions'
    }
  }]
}

const subscriptionsHttpPost = {
  handler: 'src/functions/api/subscriptions/http.post',
  events: [{
    http: {
      method: 'post',
      path: 'api/subscriptions'
    }
  }]
}

export default {
  subscriptionsHttpGet,
  subscriptionsHttpPost
}
