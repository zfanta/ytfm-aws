const oauth2 = {
  handler: 'src/functions/api/oauth2/http.get',
  events: [{
    http: {
      method: 'get',
      path: 'api/oauth2'
    }
  }]
}

const signOut = {
  handler: 'src/functions/api/oauth2/signOut.handler',
  events: [{
    http: {
      method: 'get',
      path: 'api/signOut'
    }
  }]
}

export default {
  oauth2,
  signOut
}
