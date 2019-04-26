import { Request, Response, Application } from 'express'
import { vehicleDataForVin, oilLifeRemainingForVin } from './auService'
import { decode } from 'jsonwebtoken'
import db from './repository'
const jwt = require('express-jwt')
var jwksRsa = require('jwks-rsa')

const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `${process.env.AUTH0_DOMAIN}.well-known/jwks.json`
  }),

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

    interface AccessToken {
      sub: string
    }

    app.route('/login').get(checkJwt, async (req: Request, res: Response) => {
      const token = req.headers.authorization!
      const { sub } = decode(token.replace('Bearer ', '')) as AccessToken
      try {
        const user = await getUser(sub)
        res.send({ user })
      } catch (error) {
        res.status(500).send({ error })
      }
    })

    async function getUser(sub: string) {
      const result = await db.query(`SELECT * from USERS where sub = '${sub}'`)
      if (result.rowCount > 0) {
        return result.rows[0]
      } else {
        return await registerUser(sub)
      }
    }

    async function registerUser(sub: string) {
      const result = await db.query(
        `INSERT INTO USERS (sub) values ('${sub}') RETURNING id, sub, VIN;`
      )
      return result.rows[0]
    }

    // endpoint to create user
  }
}
