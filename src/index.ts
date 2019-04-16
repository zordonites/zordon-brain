import app from './app'
const PORT = 8080

module.exports = app.listen(process.env.PORT || PORT, () => {
  console.log(`Port running on ${PORT}`)
})
