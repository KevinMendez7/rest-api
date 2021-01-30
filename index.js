/*
* Entry point of app
*
*/

// Dependencies
const http = require('http')
const { StringDecoder } = require('string_decoder')


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

    // Get headers as an object
    const headers = req.headers

    // Get the payload if any
    const decoder = new StringDecoder('utf-8')
    var buffer = ''

    req.on('data', data => buffer += decoder.write(data))

    req.on('end', () => {

        buffer += decoder.end()

        // Send the response
        res.end('hello world\n')
    
        // Log the request path
        console.log('body is ', buffer)    

    })    

})    


// Start the server
server.listen(3000, () => console.log('listening on port 3000'))