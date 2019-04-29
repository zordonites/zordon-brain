import axios from 'axios'

const tenant_id = process.env.TENANT_ID

export async function vehicleDataForVin(vin: string) {
  const result = await axios.post(
    `https://api.autonomic.ai/1/assetstate/${tenant_id}/`,
    {
      request_id: '12345',
      fields: [
        'location',
        'fuel_level_percentage',
        'oil_life_remaining',
        'model',
        'year'
      ],
      scopes: [
        {
          filter: `vin:(${vin})`
        }
      ]
    }
  )
  return result.data
}

export async function oilLifeRemainingForVin(vin: string) {
  const result = await axios.post(
    `https://api.autonomic.ai/2/timeseries/${tenant_id}/query`,
    {
      request_id: '12345',
      fields: ['_all_'],
      scopes: [
        {
          last: '7d'
        },
        {
          filter: `vin:(${vin})`
        }
      ],
      aggregations: [
        {
          group_by: 'vin',
          aggregations: [
            { reduce_by: 'max:oil_life_remaining' },
            { reduce_by: 'min:oil_life_remaining' }
          ]
        }
      ]
    }
  )
  return result.data.results['group_by:vin'][`${vin}`]
}
