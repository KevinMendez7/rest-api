/*
* Entry point of app
*
*/

// Dependencies
const http = require('http')
const { StringDecoder } = require('string_decoder');
const { callbackify } = require('util');


// Server should respond all request with a string
const server = http.createServer((req, res) => { 
    
    //Get URL to parse it
    // baseURL was added because URL instance has a bug since localhost is not a valid URL    
    const baseURL = 'http://' + req.headers.host + '/';
    const parsedURL = new URL(req.url, baseURL);
    
    // Get the path
    const path = parsedURL.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g,'')
    const params = parsedURL.searchParams
    
    // Get the query strings as an object    
    const queryStringObject = params.entries.length !== 0 ? JSON.parse('{"' + decodeURI(params)
    .replace(/"/g, '\\"')
    .replace(/&/g, '","')
    .replace(/=/g,'":"') + '"}') : null

    // Get the HTTP method
    const method = req.method.toLowerCase()

    // Get headers as an object
    const headers = req.headers

    // Get the payload if any
    const decoder = new StringDecoder('utf-8')
    var buffer = ''

    req.on('data', data => buffer += decoder.write(data))

    req.on('end', () => {

        buffer += decoder.end()

        // Choose the handler this request should go to, if is not found use not found handler

        const chosenHandler = typeof(router[trimmedPath]) !== 'undefined' ? router[trimmedPath] : handlers.notfound

        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload : buffer
        }

        // Route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload) => {

            // Use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200

            //Use the payload called back by the handler or default to empty

            payload = typeof(payload) == 'object' ? payload : {}

            // Convert the payload to a string
            const payloadString = JSON.stringify(payload)

            // Return the response
            res.setHeader('Content-Type','application/json')
            res.writeHead(statusCode)            
            res.end(payloadString)

            // Log the request path
            console.log('returning this ', statusCode, payloadString)    
        })                    

    })    

})    


// Start the server
server.listen(3000, () => console.log('listening on port 3000'))

// Define handlers
let handlers = {}


// Sample handlers
handlers.sample = (data, cb) => {
    // Callback a http status code and a payload objecy
    cb(406, {'name' : 'sample handler'})
}


// Not found handler 
handlers.notfound = (data, cb) => {
    // Callback a http status code
    cb(404)
}

// Define a request router
const router = {
    'sample' : handlers.sample
}