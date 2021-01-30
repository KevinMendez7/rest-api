/*
* Entry point of app
*
*/

// Dependencies
const http = require('http')

// Server should respond all request with a string
const server = http.createServer((req, res) => { 
    
    //Get URL to parse it
    // baseURL was added because URL instance has a bug since localhost is not a valid URL    
    const baseURL = 'http://' + req.headers.host + '/';
    const parsedURL = new URL(req.url, baseURL);
    
    // Get the path
    const path = parsedURL.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g,'')

    // Get the query strings as an object
    const queryStringObject = JSON.parse('{"' + decodeURI(parsedURL.searchParams)
    .replace(/"/g, '\\"')
    .replace(/&/g, '","')
    .replace(/=/g,'":"') + '"}')

    // Get the HTTP method
    const method = req.method.toLowerCase()
    
    // Send the response
    res.end('hello world\n')

    // Log the request path
    console.log(`Request received on path: ${trimmedPath} and method ${method} with query object params`, queryStringObject)
    // console.log('Request received on path:' +trimmedPath +' and method' + method+ 'with query object params', queryStringObject)

})    


// Start the server
server.listen(3000, () => console.log('listening on port 3000'))