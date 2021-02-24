/*
* Entry point of app
*
*/

// Dependencies
const server = require('./lib/server')
const worker = require('./lib/worker')

// Declare the app

const app = {}

// Init function

app.init = () => {
    // Start the server
    server.init()

    // Start the workers
    worker.init()
}

// Execute
app.init()

// Export the app
module.exports = app