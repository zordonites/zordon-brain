import axios, { AxiosRequestConfig } from 'axios'
import { stringify } from 'qs'

const grant_type = 'client_credentials'
const tenant_id = process.env.TENANT_ID
const client_id = process.env.CLIENT_ID
const client_secret = process.env.CLIENT_SECRET
const realm = process.env.REALM

const url = `https://accounts.autonomic.ai/auth/realms/${realm}/protocol/openid-connect/token`
const body = {
  grant_type,
  client_id,
  client_secret
}

const config: AxiosRequestConfig = {
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  }
}

export async function authenticate() {
  try {
    const result = await axios.post(url, stringify(body), config)
    axios.defaults.headers.Authorization = `Bearer ${result.data.access_token}`
    console.log('Successfully authenticated!')
  } catch (error) {
    console.log('failed result', error.response.status)
  }
}

export async function vehicleDataForVin(vin = process.env.VIN) {
  try {
    const result = await axios.post(
      `https://api.autonomic.ai/1/assetstate/${tenant_id}/`,
      {
        request_id: '12345',
        fields: ['_all_'],
        scopes: [
          {
            filter: `vin:(${vin})`
          }
        ]
      }
    )
    return result.data
  } catch (error) {
    if (error.response.status === 401) {
      console.log('Unauthorized')
      //   refresh
    } else {
      return Promise.reject(
        new Error('Failed for some reason that is not auth related')
      )
    }
  }
}
