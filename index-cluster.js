/*
* Entry point of app
*
*/

// Dependencies
const cluster = require('cluster')
const os = require('os')
const server = require('./lib/server')
const worker = require('./lib/worker')
const cli = require('./lib/cli')
debugger
// Declare the app
const app = {}

// Init function
app.init = (cb) => {

  if(cluster.isMaster) {

    // if it's not in the main thread, Start the background workers and the CLI
    worker.init()

    // Start the CLI, but make sure it starts last
    setTimeout(() => {
        cli.init()
        cb()
    }, 50)

    // Fork the process
    for(let i = 0; i < os.cpus().length; i ++) {
      cluster.fork()      
    }

  } else {
    // If it's not in the master thread, Start the HTTP server
    server.init()

  }

    
}

// Self invoking only if required directly
if(require.main == module) {
  app.init(() => {})
}

// Export the app
module.exports = app