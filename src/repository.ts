import { Client } from 'pg'
const client = new Client({
  connectionString: process.env.DATABASE_URL
})
console.log(`attempting to connect to db at ${process.env.DATABASE_URL}`)

client
  .connect()
  .then(() => {
    console.log('Connected to DB')
    console.log('Updating tables')
    client.query(`CREATE TABLE IF NOT EXISTS users (
    "id" SERIAL primary key,
    "sub" varchar(30) NOT NULL,
    "vin" varchar(17)
  )`)

    client.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS device_token varchar(125)`
    )
  })
  .catch(error => {
    console.log('Failed to connect to DB', error)
  })

export default {
  query: (query: string) => client.query(query)
}
