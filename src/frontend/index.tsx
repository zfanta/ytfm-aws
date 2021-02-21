import 'regenerator-runtime/runtime'

import React, { ReactElement } from 'react'
import ReactDOM from 'react-dom'

async function getCookie (): Promise<void> {
  await fetch('/api/cookie')
}

function App (): ReactElement {
  return <div onClick={getCookie}>Allow cookie</div>
}

ReactDOM.render(<App />, document.getElementById('app'))
