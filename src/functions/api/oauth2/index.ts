const oauth2 = {
  handler: 'src/functions/api/oauth2/http.get',
  events: [{
    http: {
      method: 'get',
      path: 'api/oauth2'
    }
  }]
}

export default oauth2
