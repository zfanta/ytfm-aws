const obj = {
  handler: 'src/functions/oauth2/handler.main',
  events: [{
    http: {
      method: 'get',
      path: 'oauth2'
    }
  }]
}

export default obj
