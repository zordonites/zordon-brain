import axios from 'axios'

const tenant_id = process.env.TENANT_ID

export async function vehicleDataForVin(vin = process.env.VIN) {
  const result = await axios.post(
    `https://api.autonomic.ai/1/assetstate/${tenant_id}/`,
    {
      request_id: '12345',
      fields: ['location', 'fuel_level_percentage', 'oil_life_remaining'],
      scopes: [
        {
          filter: `vin:(${vin})`
        }
      ]
    }
  )
  return result.data
}
