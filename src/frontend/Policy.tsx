import React, { ReactElement } from 'react'
import { Divider } from '@material-ui/core'

function Policy (): ReactElement {
  return (
    <>
      <h1>Privacy and Data Policy</h1>

      <h2>Personal data our website collects</h2>

      <p>
        Our websites collects your personal data. All your personal data is deleted when you delete account on
        our website.
      </p>
      <ol>
        <li>
          Your gmail address to send youtube channel notification emails.
        </li>
        <li>
          Your google profile photos.
        </li>
        <li>
          Your google oauth2 token to collect your youtube subscription data.
        </li>
        <li>
          Your youtube subscription data to send channel notification emails.
        </li>
      </ol>

      <Divider/>

      <h1>Technologies We Use</h1>

      <h2>Browser Cookies</h2>

      <p>
        An HTTP cookie (also called web cookie, Internet cookie, browser cookie, or simply cookie) is a small piece of
        data stored on the user's computer by the web browser while browsing a website. Cookies were designed to be a
        reliable mechanism for websites to remember stateful information (such as items added in the shopping cart in
        an online store) or to record the user's browsing activity (including clicking particular buttons, logging in,
        or recording which pages were visited in the past). They can also be used to remember pieces of information that
        the user previously entered into form fields, such as names, addresses, passwords, and payment card numbers.
      </p>
      <p>
        Our website uses browser cookies to remember your account.
      </p>

      <h2>Local Storage</h2>

      <p>
        Web storage, sometimes known as DOM storage (Document Object Model storage), provides web apps with methods and
        protocols for storing client-side data. Web storage supports persistent data storage, similar to cookies but
        with a greatly enhanced capacity and no information stored in the HTTP request header. There are two main web
        storage types: local storage and session storage, behaving similarly to persistent cookies and session cookies
        respectively. Web Storage is standardized by the World Wide Web Consortium (W3C) and WHATWG. All major browsers
        support it.
      </p>
      <p>
        Our website uses local storage to cache user profile and user's youtube subscription data.
      </p>

      <Divider/>

      <h1>Contact</h1>

      <p>
        <a href="mailto:ytfm.app@gmail.com">ytfm.app@gmail.com</a>
      </p>

      <Divider/>

      <p>Last updated 1 May 2021, effective 1 May 2021.</p>
    </>
  )
}

export default Policy
