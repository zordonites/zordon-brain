import { Request, Response, Application } from 'express'
import { vehicleDataForVin, oilLifeRemainingForVin } from './auService'
const jwt = require('express-jwt')
var jwksRsa = require('jwks-rsa')

const checkJwt = jwt({
  // Dynamically provide a signing key
  // based on the kid in the header and
  // the signing keys provided by the JWKS endpoint.
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.AUTH0_DOMAIN}.well-known/jwks.json`
  }),

  // Validate the audience and the issuer.
  audience: process.env.AUTH0_AUDIENCE,
  issuer: process.env.AUTH0_DOMAIN,
  algorithms: ['RS256']
})

export class Routes {
  public routes(app: Application): void {
    app.route('/').get(checkJwt, (req: Request, res: Response) => {
      res.send('Hello World!')
    })

    app
      .route('/vehicle-data')
      .get(checkJwt, async (req: Request, res: Response) => {
        const data = await vehicleDataForVin()
        res.send(data[0])
      })

    app
      .route('/oil-life')
      .get(checkJwt, async (req: Request, res: Response) => {
        const data = await oilLifeRemainingForVin()
        res.send(data)
      })
  }
}
