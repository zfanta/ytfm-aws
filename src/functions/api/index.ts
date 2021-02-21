import oauth2 from './oauth2'
import pubsubhubbub from './pubsubhubbub'
import cookie from './cookie'

export default {
  oauth2,
  ...pubsubhubbub,
  ...cookie
}
