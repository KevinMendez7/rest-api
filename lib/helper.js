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
const { hashingSecret, twilio, templateGlobals } = require('./config')
// Container for all helpers

let helper = {}


// Sample for testing that simply returns a number
helper.getNumber = () => {
    return 1
}

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
        let obj
        if(str.indexOf('{') > -1) {
            obj = JSON.parse(str)
        } else {
            obj = JSON.parse('{"' + decodeURI(str)
           .replace(/"/g, '\\"')
           .replace(/&/g, '","')
           .replace(/=/g,'":"') + '"}')
        }

        return obj
    } catch(err) {
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
helper.getTemplate = (name, data, cb) => {
    name = typeof(name) == 'string' && name.length > 0 ? name : false
    data = typeof(data) == 'object' && data != null ? data : {}
    if(!name) {
        return cb('A valid template name was not specified')
    }

    const templateDir = path.join(__dirname, '/../template/')

    fs.readFile(`${templateDir}${name}.html`, 'utf8', (err, str) => {
        if(!(!err && str && str.length > 0)) {
            return cb('No template could be found')
        }

        // Do interpolation on the string
        const finalString = helper.interpolate(str, data)
        cb(false, finalString)
    })
} 

// Add the universal header and footer to a string and pass provided data object to the header and footer for interpolation
helper.addUniversalTemplate = (str, data, cb) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : false
    data = typeof(data) == 'object' && data != null ? data : {}

    // Get the header 
    helper.getTemplate('_header', data, (err, headerStr) => {
        if(!(!err && headerStr)) {
            return cb('Could not find the header template')
        }

        // Get the footer
        helper.getTemplate('_footer', data, (err, footerStr) => {
            if(!(!err && footerStr)) {
                return cb('Could not find the footer template')
            }   

            // Add them all together
            const fullString = headerStr + str + footerStr
            cb(false, fullString)
        })
    })
}

// Taking a giving string and a data object and find/replace all the keys within it 
helper.interpolate = (str, data) => {
    str = typeof(str) == 'string' && str.length > 0 ? str : ''
    data = typeof(data) == 'object' && data != null ? data : {}

    // Add the template globals to the data object, prepending the key name with "global"
    for(let keyName in templateGlobals) {
        if(templateGlobals.hasOwnProperty(keyName)) {
            data['global.' + keyName] = templateGlobals[keyName]
        }

    }
    // For each key in data object, insert its value into the string at the corresponding placeholder
    for(let key in data) {
        if(data.hasOwnProperty(key) && typeof(data[key]) == 'string') {
            let replace = data[key]
            let find = `{${key}}`
            str = str.replace(find, replace)
        }
    }

    return str
}

// Get the contents of a static (public) asset
helper.getStaticAsset = (fileName, cb) => {
    fileName = typeof(fileName) == 'string' && fileName.length > 0 ? fileName : false

    if(!fileName) {
        return cb('A valid file name was not specified')
    }

    const publicDir = path.join(__dirname, '/../public/')
    fs.readFile(`${publicDir}${fileName}`, (err, data) => {
        if(!(!err && data)) {
            return cb('No file could be found')
        }

        cb(false, data)
    })
}

// Export the container
module.exports = helper