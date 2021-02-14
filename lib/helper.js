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

// Export the container
module.exports = helper