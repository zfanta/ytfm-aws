import React, { ReactElement, useEffect, useState } from 'react'
import { Collapse } from '@material-ui/core'
import { inflateRaw } from 'zlib'

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

    try {
      const decoded = encoded.split('%')
        .map(encoded => decodeURIComponent(encoded.replace(/=\n/g, '').replace(/=/g, '%')))
        .join('%')

      setDecoded(decoded)
    } catch (e) {
      setDecoded(e.toString())
    }
  }

  function encodeQP (event: React.ChangeEvent<HTMLTextAreaElement>): void {
    const decoded = event.target.value
    setDecoded(decoded)

    try {
      // eslint-disable-next-line no-control-regex
      const encoded = decoded.replace(/([^\x00-\x7F]|=)+/g, matched => {
        return encodeURIComponent(matched).replace(/%/g, '=')
      })

      setEncoded(encoded)
    } catch (e) {
      setEncoded(e.toString())
    }
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

function DecodeDebugHeader (): ReactElement {
  const [visible, setVisible] = useState(false)
  const [encoded, setEncoded] = useState<string>('')
  const [video, setVideo] = useState<string>('')
  const [xml, setXml] = useState<string>('')

  useEffect(() => {
    if (location.hash === '#decode-debug-header') {
      setVisible(true)
    }
  }, [])

  function toggleVisible (): void {
    setVisible(!visible)
  }

  function decodeDebugHeader (event: React.ChangeEvent<HTMLTextAreaElement>): void {
    const encoded = event.target.value
    setEncoded(encoded)

    const compressed = Buffer.from(encoded, 'base64')
    inflateRaw(compressed, (error, result) => {
      if (error !== null) {
        setVideo(JSON.stringify(error))
        setXml(JSON.stringify(error))
      } else {
        const parsed = JSON.parse(result.toString())
        console.log(parsed)
        setVideo(JSON.stringify(parsed.video, null, 2))
        setXml(parsed.xml)
      }
    })
  }

  return (
    <>
      <h1 id="decode-debug-header">
        <a href="#decode-debug-header" onClick={toggleVisible}>Decode debug header</a>
      </h1>
      <Collapse in={visible}>
        <h2>Encoded</h2>
        <textarea rows={20} style={{ width: '100%' }} value={encoded} onChange={decodeDebugHeader}/>

        <h2>Video</h2>
        <textarea disabled rows={20} style={{ width: '100%' }} value={video}/>

        <h2>xml</h2>
        <textarea disabled rows={20} style={{ width: '100%' }} value={xml}/>
      </Collapse>
    </>
  )
}

function Tools (): ReactElement {
  return (
    <>
      <QP/>
      <DecodeDebugHeader/>
    </>
  )
}

export default Tools
