const axios = require('axios')
const crypto = require('crypto')

// construct authentication token
const mkToken = () => {
  const apiKey = process.env.APIKEY
  const secretKey = process.env.SECRETKEY

  if (apiKey == undefined || secretKey == undefined) {
    return undefined
  }

  const ts = String(Date.now())
  const hmac = crypto.createHmac('sha1', secretKey)
  hmac.update(ts)

  return `${apiKey}:${hmac.digest('base64')}:${ts}`
}

const mkHeaders = (token) => {
  return {
    'content-type': 'application/json',
    'x-cns-security-token': token
  }
}

console.log(`${JSON.stringify(mkHeaders(mkToken()))}`)

const client = axios.create({
  baseURL: 'https://api.dns.constellix.com',
  headers: mkHeaders(mkToken())
})

// test call
client
  .get('/v1/domains')
  .then( (res) => {
    console.log(res.data.filter(d => d.name == 'foobarbaz.icu'))
  })

// get pools
client
  .get('/v1/pools')
  .then( (res) => {
    const pool = res.data.filter(p => p.name == 'foo-pool')[0]
    // TODO: match action on p.type?
    // get pool
    client
      .get(`/v1/pools/CNAME/${pool.id}`)
      .then( (res) => {
        // change policy
        client
          .put(`/v1/pools/CNAME/${pool.id}`, {
            name: 'foo-pool',
            numReturn : 1,
            minAvailableFailover: 0,
            values: [
              {
                value: 'foo.foobarbaz.icu.',
                weight: 10,
                policy: 'followsonar'
              }
            ]
          })
          .then( (res) => {
            console.log(res.data)
          })
          .catch( (err) => {
            console.log(err.response)
          })
      })
  })
