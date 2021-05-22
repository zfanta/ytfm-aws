const cookieHttpGet = {
  handler: 'src/functions/api/cookie/http.get',
  events: [{
    http: {
      cors: true,
      method: 'get',
      path: 'api/cookie'
    }
  }]
}

const pruneCookie = {
  handler: 'src/functions/api/cookie/prune.handler',
  events: [{
    schedule: 'rate(1 day)'
  }]
}

export default { cookieHttpGet, pruneCookie }
