import { Request, Response, Application } from 'express'

export class Routes {
  public routes(app: Application): void {
    app.route('/').get(async (req: Request, res: Response) => {
      res.send('Hello World!')
    })
  }
}
