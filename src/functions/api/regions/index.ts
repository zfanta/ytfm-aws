const regionsHttpGet = {
  handler: 'src/functions/api/regions/http.get',
  events: [{
    http: {
      method: 'get',
      path: 'api/regions'
    }
  }, {
    http: {
      method: 'get',
      path: 'api/regions/{language}'
    }
  }]
}

export default { videoHttpGet: regionsHttpGet }
