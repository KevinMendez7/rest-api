/*
* Entry point of app
*
*/

// Dependencies
const http = require('http')

// Server should respond all request with a string
const server = http.createServer((req, res) => res.end('hello world\n'))

// Start the server
server.listen(3000, () => console.log('listening on port 3000'))