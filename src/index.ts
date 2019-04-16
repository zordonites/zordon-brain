import app from './App'
const PORT = 8080

module.exports = app.listen(process.env.PORT || PORT, () => {
  console.log(`Port running on ${PORT}`)
})
