import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'
import * as jwt from 'jsonwebtoken'
import { stringify } from 'qs'

const client_id = process.env.CLIENT_ID
const client_secret = process.env.CLIENT_SECRET
const realm = process.env.REALM
const hostname = process.env.HOSTNAME
const tokenUrl = `https://accounts.${hostname}/auth/realms/${realm}/protocol/openid-connect/token`
let refreshToken: Token

interface Token {
  value: string
  expiresAt: number
}

axios.interceptors.response.use(handleSuccessfulResponse, handleError)

export async function authenticate() {
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  const body = {
    grant_type: 'client_credentials',
    client_id,
    client_secret
  }
  try {
    const {
      data: { access_token, refresh_token }
    } = await axios.post(tokenUrl, stringify(body), config)
    updateCredentials(access_token, refresh_token)
    console.log('Successfully authenticated!')
    return access_token
  } catch (error) {
    console.log('failed result', error)
  }
}

export async function refreshTokens() {
  const config: AxiosRequestConfig = {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
  const body = {
    grant_type: 'refresh_token',
    client_id,
    client_secret,
    refresh_token: refreshToken.value
  }
  try {
    const currentTime = Date.now()
    if (currentTime > refreshToken.expiresAt) {
      return await authenticate()
    }
    return await refresh(body, config)
  } catch (error) {
    console.log('Refresh Error:', error)
    throw new Error('Failed to refresh token')
  }
}

async function refresh(
  body: {
    grant_type: string
    client_id: string | undefined
    client_secret: string | undefined
    refresh_token: string
  },
  config: AxiosRequestConfig
) {
  const {
    data: { access_token, refresh_token }
  } = await axios.post(tokenUrl, stringify(body), config)
  updateCredentials(access_token, refresh_token)
  return access_token
}

async function handleError(error: any) {
  // Can happen if network is unreachable.
  if (!error.response) {
    return Promise.reject(error)
  }

  if (error.response.status === 401) {
    try {
      const originalRequest = error.config
      const bearerToken = await refreshTokens()
      originalRequest.headers['Authorization'] = `Bearer ${bearerToken}`

      if (!refreshToken || originalRequest['__haveRetried']) {
        return Promise.reject(error)
      }

      return retry(originalRequest)
    } catch (error) {
      return Promise.reject(error)
    }
  }
  return Promise.reject(error)
}

function updateCredentials(access_token: string, refresh_token: string) {
  axios.defaults.headers.Authorization = `Bearer ${access_token}`
  const decoded = jwt.decode(refresh_token) as any
  refreshToken = { value: refresh_token, expiresAt: decoded.exp * 1000 }
}

async function retry(originalRequest: any) {
  originalRequest.__haveRetried = true
  return await axios(originalRequest)
}

function handleSuccessfulResponse(response: AxiosResponse) {
  return response
}
