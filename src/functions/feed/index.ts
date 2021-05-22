const feedHttpGet = {
  handler: 'src/functions/feed/http.get',
  events: [{
    http: {
      method: 'get',
      path: 'feed/{channelId}'
    }
  }]
}

export default { feedHttpGet }
