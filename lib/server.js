/*
 * Server related task
 *
 */


// Dependencies
const http = require('http')
const https = require('https')
const fs = require('fs')
const path = require('path')
const { StringDecoder } = require('string_decoder');
const util = require('util')
const { httpPort, httpsPort, envName } = require('./config');
const handler = require('./handler');
const { parseJSONtoObject } = require('./helper');
const debug = util.debuglog('server')

// Instanciate the server module object

const server = {}

// Server should respond all request with a string
server.httpServer = http.createServer((req, res) => server.server(req,res))    

server.httpsOptions = {
    key : fs.readFileSync(path.join(__dirname, '../https/key.pem')),
    cert : fs.readFileSync(path.join(__dirname, '../https/cert.pem'))
    
}

server.httpsServer = https.createServer(server.httpsOptions , (req, res) => server.server(req,res))    

server.server = (req, res) => { 
    
    //Get URL to parse it
    // baseURL was added because URL instance has a bug since localhost is not a valid URL    
    const baseURL = 'http://' + req.headers.host + '/';
    const parsedURL = new URL(req.url, baseURL);
    
    // Get the path
    const path = parsedURL.pathname
    const trimmedPath = path.replace(/^\/+|\/+$/g,'')
    const params = parsedURL.searchParams        
    
    // Get the query strings as an object    
    const queryStringObject = params.toString().length !== 0 ? JSON.parse('{"' + decodeURI(params)
    .replace(/"/g, '\\"')
    .replace(/&/g, '","')
    .replace(/=/g,'":"') + '"}') : {}

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

        console.log(trimmedPath)

        let chosenHandler = typeof(server.router[trimmedPath]) !== 'undefined' ? server.router[trimmedPath] : handler.notfound

        // If the request is within in the public directory, use the public handler instead
        chosenHandler = trimmedPath.indexOf('public/') > -1 ? handler.public : chosenHandler
        
        const data = {
            trimmedPath,
            queryStringObject,
            method,
            headers,
            payload : parseJSONtoObject(buffer ? buffer : '{}')
        }

        // Route the request to the handler specified in the router
        chosenHandler(data, (statusCode, payload, contentType) => {

            //Determine the type of response (fallbakc to JSON)
            contentType = typeof(contentType) == 'string' ? contentType : 'json'

            // Use the status code called back by the handler or default to 200
            statusCode = typeof(statusCode) == 'number' ? statusCode : 200

            
            
            
            // Return the response parts that are content-specific
            let payloadString = ''
            if(contentType == 'json') {
                res.setHeader('Content-Type','application/json')
                
                //Use the payload called back by the handler or default to empty
                payload = typeof(payload) == 'object' ? payload : {}
                
                // Convert the payload to a string
                payloadString = JSON.stringify(payload)
                
            }
            
            if(contentType == 'html') {
                res.setHeader('Content-Type','text/html')
                payloadString = typeof(payload) == 'string' ? payload : ''

            }
            if(contentType == 'favicon') {
                res.setHeader('Content-Type','image/x-icon')
                payloadString = typeof(payload) != 'undefined' ? payload : ''

            }
            if(contentType == 'css') {
                res.setHeader('Content-Type','text/css')
                payloadString = typeof(payload) != 'undefined' ? payload : ''

            }
            if(contentType == 'png') {
                res.setHeader('Content-Type','image/png')
                payloadString = typeof(payload) != 'undefined' ? payload : ''
                
            }
            if(contentType == 'jpg') {
                res.setHeader('Content-Type','image/jpg')
                payloadString = typeof(payload) != 'undefined' ? payload : ''
                
            }
            if(contentType == 'plain') {
                res.setHeader('Content-Type','text/plain')
                payloadString = typeof(payload) != 'undefined' ? payload : ''

            }

            // Return the response parts that are common to all content types
            res.writeHead(statusCode)            
            res.end(payloadString)

            if(statusCode == 200) {
                debug('\x1b[32m%s\x1b[0m', method.toUpperCase() + '/' + trimmedPath + ' ' + statusCode )
            } else {
                debug('\x1b[31m%s\x1b[0m', method.toUpperCase() + '/' + trimmedPath + ' ' + statusCode )
            }

            // Log the request path
            debug('returning this ', statusCode, payloadString)    
        })                    

    })    

}

// Define a request router
server.router = {
    '' : handler.index,
    'account/create' : handler.accountCreate,
    'account/edit' : handler.accountEdit,
    'account/deleted' : handler.accountDeleted,
    'session/create' : handler.sessionCreate,
    'session/deleted' : handler.sessionDeleted,
    'checks/all' : handler.checkList,
    'checks/create' : handler.checksCreate,
    'checks/edit' : handler.checkEdit,
    'ping' : handler.ping,
    'api/users' : handler.user,
    'api/tokens' : handler.token,
    'api/checks' : handler.check,
    'favicon' : handler.favicon,
    'public' : handler.public
}

// Init script
server.init = () => {
    // Start the http server
    server.httpServer.listen(httpPort, () => console.log('\x1b[36m%s\x1b[0m', `listening on port ${httpPort} and ${envName} mode`))

    // Start the https server
    server.httpsServer.listen(httpsPort, () => console.log('\x1b[35m%s\x1b[0m', `listening on port ${httpsPort} and ${envName} mode`))
}

module.exports = server