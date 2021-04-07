const profileHttpGet = {
  handler: 'src/functions/api/profile/http.get',
  events: [{
    http: {
      method: 'get',
      path: 'api/profile'
    }
  }]
}

const profileHttpDelete = {
  handler: 'src/functions/api/profile/http.deleteHandler',
  events: [{
    http: {
      method: 'delete',
      path: 'api/profile'
    }
  }]
}

export default {
  profileHttpGet,
  profileHttpDelete
}
