import { Request, Response, Application } from 'express'
import { vehicleDataForVin, oilLifeRemainingForVin } from './auService'

export class Routes {
  public routes(app: Application): void {
    app.route('/').get((req: Request, res: Response) => {
      res.send('Hello World!')
    })

    app.route('/vehicle-data').get(async (req: Request, res: Response) => {
      const data = await vehicleDataForVin()
      res.send(data[0])
    })

    app.route('/oil-life').get(async (req: Request, res: Response) => {
      const data = await oilLifeRemainingForVin()
      res.send(data)
    })
  }
}
