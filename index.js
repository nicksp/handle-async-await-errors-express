const express = require('express')
const boom = require('boom')

const app = express()
const PORT = process.env.PORT || 3000

const VALID_JSON = JSON.stringify({ name: 'John', surname: 'Doe', id: '12' })
const INVALID_JSON = '{ name: "John", surname: "Doe", id: "12" }'

/**
 * Express currently does not support async route handler functions out-of-the-box, so we need a little help there.
 *
 * This handler wrapper does two things:
 * 1. handles errors thrown from async route handlers and passes them to Express
 * 2. turns any caught error into a Boom error if it wasn't already a Boom error
 */
const asyncHandler = fn => (req, res, next) =>
  Promise
    .resolve(fn(req, res, next))
    .catch(err => {
      if (!err.isBoom) {
        return next(boom.badImplementation(err))
      }
      next(err)
    })

/**
 * Sample code.
 * Might result in an error, resolve with valid JSON or a valid JSON
 */
const readJSON = async () => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const rand = Math.random()
      if (rand > 0.66) {
        resolve(VALID_JSON)
      } else if (rand > 0.33) {
        resolve(INVALID_JSON)
      } else {
        reject(boom.boomify(new Error('Read operation has failed'), { statusCode: 503 }))
      }
    }, 500)
  })
}

// Rethrow the error including custom message
const parseJSON = json => {
  try {
    return JSON.parse(json)
  } catch (error) {
    throw boom.boomify(new Error('API response parse error'), {
      statusCode: 503
    })
  }
}

app.get('/', asyncHandler(async (req, res) => {
  const json = await readJSON()
  const data = parseJSON(json)
  res.send(data)
}))

/**
 * Express Error Handler
 * See: https://expressjs.com/en/guide/error-handling.html
 */
app.use((err, req, res, next) => {
  console.log(`An error happened: ${err.message}`)
  res
    .status(err.output.statusCode)
    .send(err.output.payload)
})

app.listen(PORT, () => console.log(`🌐 Example app listening on port ${PORT}`))
