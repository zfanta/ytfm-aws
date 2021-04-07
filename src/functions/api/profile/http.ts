import 'source-map-support/register'

import { handler as get } from './http.get'
import { handler as deleteHandler } from './http.delete'

export {
  get,
  deleteHandler
}
