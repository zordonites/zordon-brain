### Running

- install docker
- docker-compose -f $PROJECT_DIR/stack.yml up
- yarn start 
- to connect locally: psql -h localhost -p 5432 -U zordon
  - make sure you don't have an additional postgres instance running from homebrew
  - if you do, `brew services stop postgres`

#### Required ENV

- hostname ( for the authentication service )
- client_id
- client_secret
- realm
- tenant_id
- auth0_domain
- auth0_audience
- db url
