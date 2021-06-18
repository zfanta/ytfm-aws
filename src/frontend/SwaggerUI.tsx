import React, { ReactElement } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import spec from '../../ytfm.yaml'

export default (): ReactElement => {
  console.log(spec)
  return <SwaggerUI url={spec} />
}
