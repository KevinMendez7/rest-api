/*
* Entry point of app
*
*/

// Dependencies
const http = require('http')
const url = require('url')


// Server should respond all request with a string
const server = http.createServer((req, res) => { 
    
    //Get URL to parse it
        
    const baseURL = 'http://' + req.headers.host + '/';
    const parsedURL = new URL(req.url, baseURL);
    
    
    // const parsedURL = url.parse(req.url, true)
    
    // Get the path

    const path = parsedURL.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g,'')
    
    // Send the response

    res.end('hello world\n')

    // Log the request path
    console.log('Request received on path: '+ trimmedPath)

})    


// Start the server
server.listen(3000, () => console.log('listening on port 3000'))