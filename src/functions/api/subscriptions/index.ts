const subscriptionsHttpGet = {
  handler: 'src/functions/api/subscriptions/http.get',
  events: [{
    http: {
      method: 'get',
      path: 'api/subscriptions'
    }
  }]
}

export default {
  subscriptionsHttpGet
}
