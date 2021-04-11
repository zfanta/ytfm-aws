import profileHttpPatchSchema from './http.patch.schema'

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

const profileHttpPatch = {
  handler: 'src/functions/api/profile/http.patch',
  events: [{
    http: {
      method: 'patch',
      path: 'api/profile',
      request: {
        schema: {
          'application/json': profileHttpPatchSchema
        }
      }
    }
  }]
}

export default {
  profileHttpGet,
  profileHttpDelete,
  profileHttpPatch
}
