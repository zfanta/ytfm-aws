import React, { ReactElement } from 'react'
import SwaggerUI from 'swagger-ui-react'
import 'swagger-ui-react/swagger-ui.css'
import yaml from 'js-yaml'
import { readFileSync } from 'fs'
import path from 'path'

export default (): ReactElement => {
  const data = readFileSync(path.join(__dirname, '../../', 'ytfm.yaml'), 'utf-8')

  const spec = yaml.load(data) as any

  return <SwaggerUI spec={spec} />
}
