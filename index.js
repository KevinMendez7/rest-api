/*
* Entry point of app
*
*/

// Dependencies
const server = require('./lib/server')
const worker = require('./lib/worker')
const cli = require('./lib/cli')
debugger
// Declare the app
const app = {}

// Init function
app.init = (cb) => {
    // Start the server
    server.init()

    // Start the workers
    worker.init()

    // Start the CLI, but make sure it starts last
    setTimeout(() => {
        cli.init()
        cb()
    }, 50)
}

// Self invoking only if required directly
if(require.main == module) {
  app.init(() => {})
}

// Export the app
module.exports = app