/*
 * Helpers for varios tasks
 *
 */

// Dependencies
const crypto = require('crypto')
const querystring = require('querystring')
const https = require('https')
const path = require('path')
const fs = require('fs')
const { hashingSecret, twilio } = require('./config')
// Container for all helpers

let helper = {}


// Create a SHA256 hash

helper.hash = (str) => {
    if(typeof(str) == 'string' && str.length > 0) {
        const hash = crypto.Hmac('sha256', hashingSecret).update(str).digest('hex')
        return hash
    } 

    return false
}

// Parse a JSON string to a object in all cases, without throwing
helper.parseJSONtoObject = (str) => {
    try {
        console.log(str)
        const obj = JSON.parse(str)
        return obj
    } catch(err) {
        console.log(err)
        return {}
    }
}

// Create a string of random alphanumeric characters of a given length
helper.createRandomString = (length) => {
    length = typeof(length) == 'number' && length > 0 ? length : false
    if(!length) {
        return false
    }

    // Define all possible characters
    const possibleCharacters = 'abcdefghijklmnopqrstuvwxyz1234567890'
    
    // Start the final string  
    let str = ''

    for(let i = 0; i <= length; i ++) {
        // Get random character for the possible characters
        const randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length)) 
        // Append this character to the final string 
        str += randomCharacter
    }

    return str
}

// Sending SMS via Twilio
helper.sendTwilioSms = (phone, message, cb) => {
    // Validate params
    phone = typeof(phone) == 'string' && phone.trim().length == 8 ? phone.trim() : false
    message = typeof(message) == 'string' && message.trim().length > 0 && message.trim().length <= 1600 ? message.trim() : false

    if(!(phone && message)) {
        return cb('Giving parameters were missing or invalid')
    }

    // Configure the request payload
    const payload = {
        from : twilio.from,
        to : `+502${phone}`,
        body : message
    }

    // Stringify the payload
    const stringPayload = querystring.stringify(payload)
    
    // Configure the request details
    const requestDetails = {
        protocol : 'https:',
        hostname : 'api.twilio.com',
        method : 'POST',
        past : `/2010-04-01/Accounts/${twilio.accountId}/Messages.json`,
        auth : `${twilio.accountSId}:${twilio.authToken}`,
        headers : {
            'Content-Type' : 'application/x-www-form-urlenconded',
            'Content-Length' : Buffer.byteLength(stringPayload)
        }
    }

    // Instanciate the request object 
    const req = https.request(requestDetails, (res) => {
        // Grab the status of the set request
        const status = res.statusCode
        // Callback succesfully if the request went through
        if([200, 201].indexOf(status)) {
            cb(false)
        } else {
            cb(true)
        }
    })

    // Bind to the error event so it does not get thrown
    req.on('error', (error) => {
        cb(e)
    })

    // Add the payload
    req.write(stringPayload)

    // End the request 
    req.end()

}

// Get the string content of a template 
helper.getTemplate = (name, cb) => {
    name = typeof(name) == 'string' && name.length > 0 ? name : false

    if(!name) {
        return cb('A valid template name was not specified')
    }

    const templateDir = path.join(__dirname, '/../template/')

    fs.readFile(`${templateDir}${name}.html`, 'utf8', (err, str) => {
        if(!(!err && str && str.length > 0)) {
            return cb('No template could be found')
        }

        cb(false, str)
    })
} 

// Export the container
module.exports = helper