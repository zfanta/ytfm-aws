import React, { ReactElement } from 'react'
import { Link } from 'wouter'

function Footer (): ReactElement {
  return (
    <>
      <Link href="/about" style={{ marginRight: '1rem' }}>About</Link>
      <Link href="/policy">Policy</Link>
    </>
  )
}

export default Footer
