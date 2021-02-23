/*
 * Request handler
 *
 */

//Dependecies
const _data = require('./data')
const { createRandomString, hash, sendTwilioSms } = require('./helper.js')
const { maxCheck } = require('./config')


// @TODO GET RID OF THIS
sendTwilioSms('56220831', 'Hello', error => {
    console.log(error)
})

// Define handler
let handler = {}


// Users handler
handler.user = (data, cb) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete']

    if(acceptedMethods.indexOf(data.method > -1)) {
        return handler._user[data.method](data, cb)
    }

    cb(405)
}

//Container for de user submethods
handler._user = {}

// User - get
// Required data: phone
// Optional data: none
handler._user.get = (data, cb) => {
    //Check that the phone is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 8 ? data.queryStringObject.phone : false
    if(!phone) {
        return cb(400, { error : 'phone parameter is required'})
    }

    const token = typeof(data.headers.token) === 'string' ? data.headers.token : false

    //verify that the given token is valid for the phone number
    handler._token.verifyToken(token, phone, (isValid) => {
        if(!isValid) {
            return cb(400, { error : 'Token is not valid'})
        }

        // Lookup the user
        _data.read('user', phone, (err, data) => {
            if(!(!err && data)) {
                return cb(400, {error : 'User was not found'})
            }
    
            // Remove the hashed password from the object before send the response
            delete data.password
            cb(200, data)
        })    
    })

}

// User - post
// Required data : firstName, lastName, phone, password, tosAgrement
// Optional data : none
handler._user.post = (data, cb) => {
    // Check that all required fields are filled out    
    
    let { firstName, lastName, phone, password, tosAgrement} = data.payload    
    firstName = typeof(firstName) == 'string' && firstName.trim().length > 0 ? firstName.trim() : false
    lastName = typeof(lastName) == 'string' && lastName.trim().length > 0 ? lastName.trim() : false
    phone = typeof(phone) == 'string' && phone.trim().length == 8 ? phone.trim() : false
    password = typeof(password) == 'string' && password.trim().length > 0 ? password.trim() : false
    tosAgrement = typeof(tosAgrement) == 'boolean' && tosAgrement ? true : false
    
    if(!(firstName && lastName && phone && password && tosAgrement)) {        
    
        return cb(400, {error: 'Missing required fields'})
    }

    _data.read('user', phone, (err, data) => {
        if(!err) {                    
            return cb(400, { error: 'User with this phone already exists'})
        }

        // Hash the password
        const hashedPassword = hash(password)

        if(!hashedPassword) {                    
            return cb(500, { error : 'Password could not be created'})
        }

        // Create user object
        _data.create('user', phone, {firstName, lastName, phone, password : hashedPassword, tosAgrement}, (err) => {
            err ? cb(500, { error : 'User couldnt be created'}) : cb(200, {message : 'User was created succesfully'})

            
        })
    
    })
    
}

// User - put
// Required data: Phone
// Optional data: firstName, lastName, password, (at least one must be especified)
// @TODO Only let an autheticated user update their own object, dont let them update anyone 
handler._user.put = (data, cb) => {
    // Check the required field
    let { firstName, lastName, phone, password, tosAgrement} = data.payload    
    phone = typeof(phone) == 'string' && phone.trim().length == 8 ? phone.trim() : false
    
    // Check the optional parameters
    firstName = typeof(firstName) == 'string' && firstName.trim().length > 0 ? firstName.trim() : false
    lastName = typeof(lastName) == 'string' && lastName.trim().length > 0 ? lastName.trim() : false    
    password = typeof(password) == 'string' && password.trim().length > 0 ? password.trim() : false

    // Error if the phone is invalid
    if(!phone) {
        return cb(400, { error : 'Phone is invalid'})
    }
    // Error if nothing is sent to update
    if(!(firstName || lastName || password)) {
        return cb(400, { error: 'Missing field to update'})
    }

    //verify that the given token is valid for the phone number
    handler._token.verifyToken(token, phone, (isValid) => {
        if(!isValid) {
            return cb(400, { error : 'Token is not valid'})
        }

        //Look up the user
        _data.read('user', phone, (err, data) => {
            if(!(!err && data)) {
                cb(400, { error : 'The specified user does not exist'})
            }

            // Update de user

            if(firstName) {
                data.firstName = firstName
            }

            if(lastName) {
                data.lastName = lastName
            }

            if(password) {
                data.password = hash(password)
            }

            // Store the new updates
            _data.update('user', phone, data, (err) => {
                if(err){
                    return cb(500, { error : 'Could not update the user'})
                }

                cb(200, { message : 'User was updated succesfully'})
            })
        })

    })
    
}

// User - delete
// Required data: phone
handler._user.delete = (data, cb) => {
    // Check for the required field   
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 8 ? data.queryStringObject.phone.trim() : false
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false

    if(!phone) {
        return cb(400, { error : 'Phone is invalid'})
    }

    //verify that the given token is valid for the phone number
    handler._token.verifyToken(token, phone, (isValid) => {
        if(!isValid) {
            return cb(400, { error : 'Token is not valid'})
        }

        //Look up the user
        _data.read('user', phone, (err, data) => {
            if(!(!err && data)) {
                cb(400, { error : 'The specified user does not exist'})
            }

            // Delete de user

            _data.delete('user', phone, (err) => {
                if(err){
                    return cb(500, { error : 'Could not delete the user'})
                }

                // Delete each of the checks associeted with the user
                const userCheck = typeof(data.check) == 'object' && data.check instanceof Array ? data.check : []
                const checksToDelete = userCheck.length

                if(!(checksToDelete > 0)) {
                    return cb(200)
                }

                const checksDeleted = 0
                const deletionErrors = false

                // Loop through the checks
                userCheck.forEach(check => {
                    // Delete the check
                    _data.delete('check', check, (err) => {
                        if(err) {
                            deletionErrors = true
                        }

                        checksDeleted ++ 
                        if(checksDeleted == checksToDelete) {
                            if(deletionErrors){
                                return cb(500, { error : 'errors encountered while attempting to delete user, not all checks was removed'})
                            }

                            return cb(200)
                        }
                    })
                })

                cb(200, { message : 'User was removed succesfully'})
            })
        })

    })
    
}


// Tokens handler
handler.token = (data, cb) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete']

    if(acceptedMethods.indexOf(data.method > -1)) {
        return handler._token[data.method](data, cb)
    }

    cb(405)
}

// Container for all the token methods
handler._token = {}

// Token - get
// Required data : id
// Optional data : none
handler._token.get = (data, cb) => {
    // Check that the id is valid
    
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id : false
    if(!id) {
        return cb(400, { error : 'phone parameter is required'})
    }

    // Lookup the token
    _data.read('token', id, (err, data) => {
        if(!(!err && data)) {
            return cb(404, {error : 'Token was not found'})
        }
        
        cb(200, data)
    })
}

// Token - post
// Required data: phone, password`
// Optional data: none
handler._token.post = (data, cb) => {
    let { phone, password} = data.payload
    phone = typeof(phone) == 'string' && phone.trim().length == 8 ? phone.trim() : false
    password = typeof(password) == 'string' && password.trim().length > 0 ? password.trim() : false

    if(!phone && !password) {
        return cb(400, {error: 'Misssing required params'})
    }

    //Lookup the user that matches the phone number 
    _data.read('user', phone, (err, userData) => {
        if(err && !userData) {
            return cb(400, {error: 'User was not fount'})
        }

        // Hash the sent password and compare it with the stored in the user object
        const hashedPassword = hash(password)

        if(hashedPassword !== userData.password) {
            return cb(400, {error : 'Credentials failed'})
        }

        // If valid, create a new token with a random name, set expiration date 1 hour in the future
        const tokenId = createRandomString(20)
        const expires = Date.now() + 1000 * 60 * 60
        const tokenObject = { 
            phone,
            'id' : tokenId,
            expires
        }
        _data.create('token', tokenId, tokenObject, (err) => {
            if(err) {
                return cb(400, { error : 'Token could not be created'})
            }

            cb(200, tokenObject)
        })
    })
}

// Token - put
// Required data : id, extend
// Optional data: none 
handler._token.put = (data, cb) => {
    let { id, extend} = data.payload
    id = typeof(id) == 'string' && id.trim().length > 0 ? id.trim() : false
    extend = typeof(extend) == 'boolean' && extend ? extend : false

    if(!id && !extend) {
        return cb(400, { error : 'Missing required params'})
    }

    // Lookup the token
    _data.read('token', id, (err, data) => {
        if(err && !data) {
            return cb(400, { error : 'Specified token does not exist'} )
        }

        // Check to make sure the token is not already expired 

        if(data.expires < Date.now()) {
            return cb(400, {error : 'Token already expired and cannot be exteded'})
        }

        // Set the expiration an hour from now
        data.expires = Date.now() * 1000 * 60 * 60

        _data.update('token', id, data , (err) => {
            if(err) {
                return cb(400, {error : 'Token expiration could not be updated'})
            }

            cb(200, { message : 'Token was updated'})
        })
    })
}

// Token - delete
// Required data: id
// Optional data : none
handler._token.delete = (data, cb) => {
    // Check if the id is valid
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false

    if(!id) {
        return cb(400, { error : 'id is invalid'})
    }

    //Look up the token
    _data.read('token', id, (err, data) => {
        if(!(!err && data)) {
            cb(400, { error : 'The specified user does not exist'})
        }

        // Delete de user
        _data.delete('token', id, (err) => {
            if(err){
                return cb(500, { error : 'Could not delete the token'})
            }

            cb(200, { message : 'Token was removed succesfully'})
        })
    })
}

// Verify if a given token id is currently valid for a given user

handler._token.verifyToken = (id, phone, cb) => {
    // Lookup the token 
    _data.read('token', id, (err, data) => {
        if(err && !data) {
            return cb(false)
        }

        // Check if the token for the given user and has not expired
        console.log(data.expires < Date.now(), 'expiro')
        if(data.phone != phone || data.expires < Date.now()) {
            return cb(false)
        }

        cb(true)
    })
}

// Check handler
handler.check = (data, cb) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete']

    if(acceptedMethods.indexOf(data.method > -1)) {
        return handler._check[data.method](data, cb)
    }

    cb(405)
}

// Container for all the check methods
handler._check = {}

// check - get
// Required data : id
// Optional data : none
handler._check.get = (data, cb) => {
    //Check that the id is valid
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id : false
    if(!id) {
        return cb(400, { error : 'id parameter is required'})
    }

    // Lookup the check
    _data.read('check', id, (err, checkData) => {
        if(err && !checkData) {
            return cb(404, { error : 'Check does not exist'})
        }

        const token = typeof(data.headers.token) === 'string' ? data.headers.token : false
    
        //verify that the given token is valid and belongs to the user who created the check
        handler._token.verifyToken(token, checkData.userPhone, (isValid) => {
            if(!isValid) {
                return cb(400, { error : 'Token is not valid'})
            }
    
            // Return the check data
            cb(200, checkData)
            
        })    
    })

}

// check - post
// Required data : protocol, url, method, successCode, timeoutSeconds
// Optional data : none
handler._check.post = (data, cb) => {
    let { protocol, url, method, successCode, timeoutSeconds } = data.payload
    protocol = typeof(protocol) == 'string' && ['https', 'http'].indexOf(protocol) > -1 ? protocol : false
    url = typeof(url) == 'string' && url.trim().length > 0 ? url.trim() : false
    method = typeof(method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(method) > -1 ? method : false
    successCode = typeof(successCode) == 'object' && successCode instanceof Array && successCode.length > 0 ? successCode : false
    timeoutSeconds = typeof(timeoutSeconds) == 'number' && timeoutSeconds % 1 === 0 && timeoutSeconds >=1 && timeoutSeconds <= 5 ? timeoutSeconds : false

    console.log(protocol, url, method, successCode,timeoutSeconds)
    if(!(protocol && url && method && successCode && timeoutSeconds)) {
        return cb(400, { error : 'Missing required inputs'})
    }

    // Check the token in the headers
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false

    // Lookup the user by reading the token 
    _data.read('token', token, (err, data) => {
        if(err && !data) {
            return cb(403, { error : 'Token not found'})
        }

        const userPhone = data.phone    

        // Lookup the user data
        _data.read('user', userPhone, (err, data) => {
            if(err && !data) {
                return cb(403, { error : 'User was not found'})
            }

            const check = typeof(data.check) == 'object' && data.check instanceof Array ? data.check : []
            console.log(check)
            console.log(check.length)
            // Verify that the user has less than the number of max-checks-per-user
            if(check.length >= maxCheck) {
                return cb(400, { error : `The user already has the maximun number of checks (${maxCheck})`})
            }

            // Create a random id for the check
            const checkId = createRandomString(20)

            // Create the check object and include the user's phone
            const checkObject = {
                id : checkId,
                userPhone,
                protocol,
                url,
                method,
                successCode,
                timeoutSeconds
            }

            // Store the object
            _data.create('check', checkId, checkObject, (err) => {
                if(err) {
                    return cb(500, { error : 'Check could not be created'})
                }

                // Add the check id to the user's object
                data.check = check
                data.check.push(checkId)

                // Upate the user data
                _data.update('user', userPhone, data, (err) => {
                    if(err) {
                        return cb(500, { error : 'User could not be updated'})
                    }

                    cb(200, checkObject)
                })
            })
 
        })
    })
    
}
// check - put
// Required data : id
// Optional data : protocol, url, method, successCode, timeoutSeconds (At least one must be sent)
handler._check.put = (data, cb) => {
    // Check the required field
    let { id, protocol, url, method, successCode, timeoutSeconds } = data.payload    
    id = typeof(id) == 'string' && id.trim().length > 0 ? id.trim() : false
    
    // Check the optional parameters
    protocol = typeof(protocol) == 'string' && ['https', 'http'].indexOf(protocol) > -1 ? protocol : false
    url = typeof(url) == 'string' && url.trim().length > 0 ? url.trim() : false
    method = typeof(method) == 'string' && ['get', 'post', 'put', 'delete'].indexOf(method) > -1 ? method : false
    successCode = typeof(successCode) == 'object' && successCode instanceof Array && successCode.length > 0 ? successCode : false
    timeoutSeconds = typeof(timeoutSeconds) == 'number' && timeoutSeconds % 1 === 0 && timeoutSeconds >=1 && timeoutSeconds <= 5 ? timeoutSeconds : false

    // Check valid id
    if(!id) {
        return cb(400, { error : 'Missing required fields'})
    }

    console.log(!(protocol || url || method || successCode || timeoutSeconds))
    // Check if at least one optional fields has been sent
    if(!(protocol || url || method || successCode || timeoutSeconds)) {
        return cb(400, { error : 'Missing fields to update'})
    }

    // Lookup the check 
    _data.read('check', id, (err, checkData) => {
        if(err && !checkData) {
            return cb(400, { error : 'The specified check was not found'})
        }

        const token = typeof(data.headers.token) === 'string' ? data.headers.token : false
    
        //verify that the given token is valid and belongs to the user who created the check
        handler._token.verifyToken(token, checkData.userPhone, (isValid) => {
            if(!isValid) {
                return cb(403, {error : 'Token is not valid'})
            }

            if(protocol) {
                checkData.protocol = protocol
            }
            if(url) {
                checkData.url = url
            }
            if(method) {
                checkData.method = method
            }
            if(successCode) {
                checkData.successCode = successCode
            }
            if(timeoutSeconds) {
                checkData.timeoutSeconds = timeoutSeconds
            }

            _data.update('check', id, checkData, (err) => {
                if(err) {
                    return cb(500, { error : 'Check could not be updated'})
                }

                cb(200, {error : 'Check was updated'})
            })
        })

    })


}
// check - delete
// Required data : id
// Optional data : none
handler._check.delete = (data, cb) => {
    // Check if the id is valid
    const id = typeof(data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length > 0 ? data.queryStringObject.id.trim() : false
    const token = typeof(data.headers.token) == 'string' ? data.headers.token : false

    if(!id) {
        return cb(400, { error : 'id is invalid'})
    }

    // Lookup the check
    _data.read('check', id, (err, checkData) => {
        if(err && !checkData) {
            return cb(400, { error : 'The specified check was not found'})
        }

        //verify that the given token is valid for the phone number
        handler._token.verifyToken(token, checkData.userPhone, (isValid) => {
            if(!isValid) {
                return cb(400, { error : 'Token is not valid'})
            }

            // Delete check
            _data.delete('check', id, (err) => {
                if(err){
                    return cb(500, { error : 'Could not delete the check'})
                }

                //Look up the user
                _data.read('user', checkData.userPhone, (err, userData) => {
                    if(!(!err && userData)) {
                        return cb(403, { error : 'COuld not found the user who created the check'})
                    }

                    const userCheck = typeof(userData.check) == 'object' && userData.check instanceof Array ? userData.check : []

                    // Remove the delete check from  their list  of checks
                    const checkPosition =  userCheck.indexOf(id)
                    if(!(checkPosition > -1)) {
                        return cb(403, { error : 'Check was not found in user object'})
                    }

                    userCheck.splice(checkPosition, 1)

                    // Delete de user
                    _data.update('user', checkData.userPhone, userData, (err) => {
                        if(err){
                            return cb(500, { error : 'Could not delete check in user object'})
                        }

                        cb(200, { message : 'Check was removed succesfully'})
                    })

                    // cb(200, { message : 'User was removed succesfully'})
                })
            })

        })
    })

}

// Ping handler
handler.ping = (data, cb) => {
    // Callback a http status code and a payload object
    cb(200)
}


// Not found handler 
handler.notfound = (data, cb) => {
    // Callback a http status code
    cb(404)
}

//Export the module handler

module.exports = handler