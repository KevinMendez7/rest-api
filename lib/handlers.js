/*
 * Request handlers
 *
 */

//Dependecies
const _data = require('./data')
const helper = require('./helper.js')

// Define handlers
let handlers = {}


// Users handler
handlers.user = (data, cb) => {
    const acceptedMethods = ['get', 'post', 'put', 'delete']

    if(acceptedMethods.indexOf(data.method > -1)) {
        return handlers._user[data.method](data, cb)
    }

    cb(405)
}

//Container for de user submethods
handlers._user = {}

// User - get
// Required data: phone
// Optional data: none
// @todo Only let an authenticated user access their object, dont let them access anyone
handlers._user.get = (data, cb) => {
    //Check that the phone is valid
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 8 ? data.queryStringObject.phone : false
    if(!phone) {
        return cb(400, { error : 'phone parameter is required'})
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
}

// User - post
// Required data : firstName, lastName, phone, password, tosAgrement
// Optional data : none
handlers._user.post = (data, cb) => {
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
        const hashedPassword = helper.hash(password)

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
handlers._user.put = (data, cb) => {
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
            data.password = helper.hash(password)
        }

        // Store the new updates
        _data.update('user', phone, data, (err) => {
            if(err){
                return cb(500, { error : 'Could not update the user'})
            }

            cb(200, { message : 'User was updated succesfully'})
        })
    })
    
}

// User - delete
// Required data: phone
// @TODO Only let an authenticated user delete their own object, do not let delete onyone
// @TODO Clean up (delete) any other data files asocieted with the user
handlers._user.delete = (data, cb) => {
    // Check for the required field   
    const phone = typeof(data.queryStringObject.phone) == 'string' && data.queryStringObject.phone.trim().length == 8 ? data.queryStringObject.phone.trim() : false

    if(!phone) {
        return cb(400, { error : 'Phone is invalid'})
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

            cb(200, { message : 'User was removed succesfully'})
        })
    })
    
}

// Ping handlers
handlers.ping = (data, cb) => {
    // Callback a http status code and a payload object
    cb(200)
}


// Not found handler 
handlers.notfound = (data, cb) => {
    // Callback a http status code
    cb(404)
}

//Export the module handlers

module.exports = handlers