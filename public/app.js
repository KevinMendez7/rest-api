/*
 * Frontend logic for the app
 *
 */

const app = {}

// Config
app.config = {
    sessionToken : false
}

// AJAX client for RESTFul API
app.client = {}

// Interface for making api calls

app.client.request = (headers, path, method, queryStringObject, payload, cb) =>{
    //Set defaults
    headers = typeof(headers) == 'object' && headers != null ? headers : {}
    path = typeof(path) == 'string' ? path : '/'
    method = typeof(method) == 'string' && ['GET','POST','PUT','DELETE'].indexOf(method) > -1 ? method.toUpperCase() : 'GET'
    queryStringObject = typeof(queryStringObject) == 'object' && queryStringObject != null ? queryStringObject : {}
    payload = typeof(payload) == 'object' && payload != null ? payload : {}
    cb = typeof(cb) == 'function' ? cb : false

    // For each query string parameter sent, add it to the path
    let requestUrl = `${path}?`
    let counter = 0
    for(let queryKey in queryStringObject) {
        if(queryStringObject.hasOwnProperty(queryKey)) {
            counter++

            // If at least one query parameter has been already added, prepend new ones an ampersand
            if(counter > 1) {
                requestUrl += '&'
            }

            //Add the key value
            requestUrl+=`${queryKey}=${queryStringObject[queryKey]}`
        }
    }

    // Form the http request as a JSON type
    const xhr = new XMLHttpRequest()
    xhr.open(method, requestUrl, true)
    xhr.setRequestHeader('Content-Type', 'application/json')

    // For each header sent, add it to the request
    for(let headerKey in headers) {
        if(headers.hasOwnProperty(headerKey)) {
            xhr.setRequestHeader(headerKey, headerKey[headerKey])
        }
    }

    // If the is a current session token set, add it as header
    if(app.config.sessionToken) {
        xhr.setRequestHeader('token', app.config.sessionToken.id)
    }

    // When the request comes back, handle the response 
    xhr.onreadystatechange = () =>{
        if(xhr.readyState == XMLHttpRequest.DONE) {
            const statusCode = xhr.status
            const response = xhr.responseText

            // Callback if requested
            if(cb) {
                try {
                    const parsedResponse = JSON.parse(response)
                    cb(statusCode, parsedResponse)
                } catch (error) {
                    cb(statusCode, false)
                }
            }
        }
    }

    // Set the payload as JSON
    const payloadString = JSON.stringify(payload)
    xhr.send(payloadString)
}