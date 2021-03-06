require('dotenv').config()

import app from './app'
import { authenticate } from './auth'
const PORT = 8080

module.exports = app.listen(process.env.PORT || PORT, () => {
  console.log(`Port running on ${PORT}`)
  authenticate()
})
