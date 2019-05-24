import { Request, Response, Application } from 'express'
import { vehicleDataForVin, oilLifeRemainingForVin } from './auService'
import { decode } from 'jsonwebtoken'
import db from './repository'
import apn from 'apn'

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

const validateVin = (req: Request, res: Response, next: Function) => {
  if (req.headers['vin'] === 'undefined') {
    res.status(400).send()
  } else {
    next()
  }
}

console.log(process.env.APNS_KEY)
const apns = new apn.Provider({
  token: {
    key: `${process.env.APNS_KEY!}`,
    keyId: process.env.APNS_KEY_ID!,
    teamId: process.env.APNS_TEAM_ID!
  },
  production: false
})

export class Routes {
  public routes(app: Application): void {
    app.route('/').get(checkJwt, validateVin, (req: Request, res: Response) => {
      res.send('Hello World!')
    })

    app
      .route('/vehicle-data')
      .get(checkJwt, validateVin, async (req: Request, res: Response) => {
        const vin = req.headers['vin'] as string
        const data = await vehicleDataForVin(vin)
        res.send(data[0])
      })

    app
      .route('/oil-life')
      .get(checkJwt, validateVin, async (req: Request, res: Response) => {
        const vin = req.headers['vin'] as string
        const data = await oilLifeRemainingForVin(vin)
        res.send(data)
      })

    interface AccessToken {
      sub: string
    }

    app.route('/login').get(checkJwt, async (req: Request, res: Response) => {
      //TODO: break out endpoints to be restful
      const token = req.headers.authorization!
      const { sub } = decode(token.replace('Bearer ', '')) as AccessToken
      try {
        const user = await getUser(sub)
        res.send({ user })
      } catch (error) {
        res.status(500).send({ error })
      }
    })

    app
      .route('/user/:id')
      .patch(checkJwt, async (req: Request, res: Response) => {
        //TODO: handle user fetching in middleware??
        const token = req.headers.authorization!
        const { sub } = decode(token.replace('Bearer ', '')) as AccessToken
        try {
          const user = await getUser(sub)
          // if request body has token
          if (req.body.device_token) {
            console.log('token', req.body.device_token)
            if (user.id == req.params.id) {
              const updatedUser = await updateDeviceToken(
                req.params.id,
                req.body.device_token
              )
              res.send({ user: updatedUser })
            } else {
              res.status(403).send({ error: 'Unauthorized user' })
            }
          }

          // if request body has VIN
          if (req.body.vin) {
            if (user.id == req.params.id) {
              const updatedUser = await updateVin(req.params.id, req.body.vin)
              res.send({ user: updatedUser })
            } else {
              res.status(403).send({ error: 'Unauthorized user' })
            }
          }
        } catch (error) {
          res.status(500).send({ error })
        }
      })

    app.route('/lock').post(checkJwt, async (req: Request, res: Response) => {
      const token = req.headers.authorization!
      const { sub } = decode(token.replace('Bearer ', '')) as AccessToken
      try {
        const user = await getUser(sub)
        let notification = new apn.Notification()
        notification.badge = 3
        notification.sound = 'ping.aiff'
        notification.alert = `You are ${
          req.body.distance
        } meters away from your car, is it locked?`
        notification.topic = 'com.ford.Zordon'
        try {
          await apns.send(notification, user.device_token)
        } catch (error) {
          console.log('cannot send apns', error)
        }
      } catch (error) {
        console.log(error)
        res.status(500).send({ error })
      }
    })

    async function updateVin(id: number, vin: string) {
      const result = await db.query(
        `UPDATE USERS SET vin = '${vin}' where id = '${id}' RETURNING id, sub, vin;`
      )
      return result.rows[0]
    }

    async function updateDeviceToken(id: number, device_token: string) {
      console.log('device token', device_token)
      const result = await db.query(
        `UPDATE USERS SET device_token = '${device_token}' where id = '${id}' RETURNING id, sub, device_token;`
      )
      return result.rows[0]
    }

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
        `INSERT INTO USERS (sub) values ('${sub}') RETURNING id, sub, vin;`
      )
      return result.rows[0]
    }
  }
}
