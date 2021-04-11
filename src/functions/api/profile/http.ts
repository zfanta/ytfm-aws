import 'source-map-support/register'

import { handler as get } from './http.get'
import { handler as deleteHandler } from './http.delete'
import { handler as patch } from './http.patch'

export {
  get,
  deleteHandler,
  patch
}
