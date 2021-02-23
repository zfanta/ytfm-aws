import oauth2 from './oauth2'
import pubsubhubbub from './pubsubhubbub'
import cookie from './cookie'
import subscriptions from './subscriptions'

const profile = {
  handler: 'src/functions/api/profile.handler',
  events: [{
    http: {
      method: 'get',
      path: 'api/profile'
    }
  }]
}

export default {
  ...oauth2,
  ...pubsubhubbub,
  ...cookie,
  ...subscriptions,
  profile
}
