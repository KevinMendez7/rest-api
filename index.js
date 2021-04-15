/*
* Entry point of app
*
*/

// Dependencies
const server = require('./lib/server')
const worker = require('./lib/worker')
const cli = require('./lib/cli')

// Declare the app

const app = {}

// Init function

app.init = () => {
    // Start the server
    server.init()

    // Start the workers
    worker.init()

    // Start the CLI, but make sure it starts last
    setTimeout(() => {
        cli.init()
    }, 50)
}

// Execute
app.init()

// Export the app
module.exports = app