import 'source-map-support/register'

import { handler as get } from './http.get'
import { handler as post } from './http.post'
import { handler as patch } from './http.patch'

export {
  get,
  post,
  patch
}
