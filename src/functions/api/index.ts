import oauth2 from './oauth2'
import pubsubhubbub from './pubsubhubbub'
import cookie from './cookie'
import subscriptions from './subscriptions'
import profile from './profile'
import video from './video'

export default {
  ...oauth2,
  ...pubsubhubbub,
  ...cookie,
  ...subscriptions,
  ...profile,
  ...video
}
