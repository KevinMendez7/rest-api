/*
 * Helpers for varios tasks
 *
 */

// Dependencies
const crypto = require('crypto')
const { hashingSecret } = require('./config')
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
    
}

// Export the container
module.exports = helper