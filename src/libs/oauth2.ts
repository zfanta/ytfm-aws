import { URLSearchParams } from 'url'
import fetch from 'node-fetch'
import qs from 'querystring'
import { Token } from '@libs/types'

async function getTokenFromGoogle (code: string): Promise<Token> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, OAUTH2_REDIRECT_URL } = process.env
  if (GOOGLE_CLIENT_ID === undefined) throw new Error('GOOGLE_CLIENT_ID is undefined')
  if (GOOGLE_CLIENT_SECRET === undefined) throw new Error('GOOGLE_CLIENT_SECRET is undefined')
  if (OAUTH2_REDIRECT_URL === undefined) throw new Error('OAUTH2_REDIRECT_URL is undefined')

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  const urlencoded = new URLSearchParams()
  urlencoded.append('code', code)
  urlencoded.append('client_id', GOOGLE_CLIENT_ID)
  urlencoded.append('client_secret', GOOGLE_CLIENT_SECRET)
  urlencoded.append('redirect_uri', OAUTH2_REDIRECT_URL)
  urlencoded.append('grant_type', 'authorization_code')

  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded
  }

  return await fetch('https://accounts.google.com/o/oauth2/token', requestOptions)
    .then(async response => await response.json())
}

async function getEmail (accessToken: string): Promise<string> {
  const query = qs.stringify({
    access_token: accessToken
  })

  const response = await fetch(`https://www.googleapis.com/oauth2/v1/userinfo?${query}`).then(async response => await response.json())
  return response.email
}

async function refreshToken (refreshToken: string): Promise<Token> {
  const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET } = process.env
  if (GOOGLE_CLIENT_ID === undefined) throw new Error('GOOGLE_CLIENT_ID is undefined')
  if (GOOGLE_CLIENT_SECRET === undefined) throw new Error('GOOGLE_CLIENT_SECRET is undefined')

  const headers = {
    'Content-Type': 'application/x-www-form-urlencoded'
  }

  const urlencoded = new URLSearchParams()
  urlencoded.append('client_id', GOOGLE_CLIENT_ID)
  urlencoded.append('client_secret', GOOGLE_CLIENT_SECRET)
  urlencoded.append('refresh_token', refreshToken)
  urlencoded.append('grant_type', 'refresh_token')

  const requestOptions = {
    method: 'POST',
    headers: headers,
    body: urlencoded
  }

  return await (await fetch('https://accounts.google.com/o/oauth2/token', requestOptions)).json()
}

async function getPhotos (accessToken: string): Promise<string[]> {
  const query = qs.stringify({
    personFields: 'photos',
    access_token: accessToken
  })

  const response: PeopleResponse = await (await fetch(`https://people.googleapis.com/v1/people/me?${query}`)).json()
  return response.photos.map(photo => photo.url)
}

async function revokeToken (accessToken: string): Promise<void> {
  const query = qs.stringify({
    token: accessToken
  })

  await fetch(`https://oauth2.googleapis.com/revoke?${query}`, { method: 'POST' })
}

export {
  getTokenFromGoogle,
  refreshToken,
  getEmail,
  getPhotos,
  revokeToken
}

interface PeopleResponse {
  'resourceName': string
  'etag': string
  'photos': Array<{
    'metadata': {
      'primary': boolean
      'source': {
        'type': string
        'id': string
      }
    }
    'url': string
    'default': boolean
  }>
}
