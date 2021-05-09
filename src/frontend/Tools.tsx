import React, { ReactElement, useEffect, useState } from 'react'
import { Collapse } from '@material-ui/core'

function QP (): ReactElement {
  const [visible, setVisible] = useState(false)
  const [encoded, setEncoded] = useState<string>('')
  const [decoded, setDecoded] = useState<string>('')

  useEffect(() => {
    if (location.hash === '#qp') {
      setVisible(true)
    }
  }, [])

  function toggleVisible (): void {
    setVisible(!visible)
  }

  function decodeQP (event: React.ChangeEvent<HTMLTextAreaElement>): void {
    const encoded = event.target.value
    setEncoded(encoded)

    const decoded = decodeURIComponent(encoded.replace(/=\n/g, '').replace(/=/g, '%'))

    setDecoded(decoded)
  }

  function encodeQP (event: React.ChangeEvent<HTMLTextAreaElement>): void {
    const decoded = event.target.value
    setDecoded(decoded)

    // eslint-disable-next-line no-control-regex
    const encoded = decoded.replace(/([^\x00-\x7F]|=)+/g, matched => {
      return encodeURIComponent(matched).replace(/%/g, '=')
    })

    setEncoded(encoded)
  }

  return (
    <>
      <h1 id="qp">
        <a href="#qp" onClick={toggleVisible}>Quoted printable</a>
      </h1>
      <Collapse in={visible}>
        <h2>Encoded</h2>
        <textarea rows={20} style={{ width: '100%' }} value={encoded} onChange={decodeQP}/>

        <h2>Decoded</h2>
        <textarea rows={20} style={{ width: '100%' }} value={decoded} onChange={encodeQP}/>
      </Collapse>
    </>
  )
}

function Tools (): ReactElement {
  return (
    <>
      <QP/>
    </>
  )
}

export default Tools
