import React, { ReactElement } from 'react'
import ReactDOM from 'react-dom'

function App (): ReactElement {
  return <div>hello world</div>
}

ReactDOM.render(<App />, document.getElementById('app'))
