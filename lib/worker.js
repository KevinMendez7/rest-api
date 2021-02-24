/*
 * worker-related  tasks
 *
 */

 const path = require('path')
 const fs = require('fs')
 const url = require('url')
 const https = require('https')
 const http = require('http')
 const _data = require('./data')
 const { sendTwilioSms } = require('./helper')
 const  _log = require('./log')

 // Instanciate the worker object

 const worker = {}

 // Lookup all checks, get their data, send to a validator
 worker.gatherAllChecks = () => {
     // Get all the checks that exist in the system
     _data.list('check', (err, check) => {
        if(!(!err && check && check.length > 0)) {
            console.log('Could not find any checks to process')
        } else {            
            check.forEach(checkEl => {
                // Read in the check data
                _data.read('check', checkEl.replace('.json', ''), (err, checkDataEl) => {
                    if(!err && checkDataEl) {
                        // Pass it to the check validator and let that function continue or log error
                        worker.validateCheckData(checkDataEl)
                    } else {
                        console.log('error reading one of the checks data')
                    }
                })
            });
        }

     })
 }

 // Sanity-check the check-data
 worker.validateCheckData = (check) => {
     
     check = typeof(check) == 'object' && check != null ? check : {}
     check.id = typeof(check.id) == 'string' && check.id.trim().length > 0 ? check.id.trim() : false
     check.userPhone = typeof(check.userPhone) == 'string' && check.userPhone.trim().length == 8 ? check.userPhone.trim() : false
     check.protocol = typeof(check.protocol) == 'string' && ['http', 'https'].indexOf(check.protocol) > -1 ? check.protocol : false
     check.url = typeof(check.url) == 'string' && check.url.trim().length > 0 ? check.url.trim() : false
     check.method = typeof(check.method) == 'string' && ['get','post', 'put', 'delete'].indexOf(check.method) > -1 ? check.method : false
     check.successCode = typeof(check.successCode) == 'object' && check.successCode instanceof Array && check.successCode.length > 0 ? check.successCode : false
     check.timeoutSeconds = typeof(check.timeoutSeconds) == 'number' && check.timeoutSeconds % 1 == 0 && check.timeoutSeconds > 1 && check.timeoutSeconds <= 5 ? check.timeoutSeconds : false

     // Set the keys that not be set (if the workers have never seen this check before)
    check.state = typeof(check.state) == 'string' && ['up', 'down'].indexOf(check.state) > -1 ? check.state : 'down'
    check.lastChecked = typeof(check.lastChecked) == 'number' && check.lastChecked > 0 ? check.lastChecked : false

    // If all the checks pass the data along the next step in the process
    if(check.id && check.userPhone && check.protocol && check.url && check.method && check.successCode && check.timeoutSeconds){
        worker.performCheck(check)
    } else {
        console.log('error: one of the checks is not properly fotmatted, Skipping it')
    }

 }

 // Perform the check, send the check and the outcome of the check proccess, to the next step in the proccess
 worker.performCheck = (check) => {
    // Prepare the initial check outcome
    const checkOutcome = {
        error : false,
        responseCode : false 
    }

    // Mark that the outcome has not been sent yet
    let outcomeSent = false

    // Parse the hostname and the path out of the original check
    const parsedUrl = url.parse(`${check.protocol}://${check.url}`, true)
    const hostname = parsedUrl.hostname
    const path = parsedUrl.path // Using path and not pathname because we want the querystring 

    // Construct the request
    const requestDetails = {
        protocol : `${check.protocol}:`,
        hostname : hostname,
        method : check.method.toUpperCase(),
        path : path,
        timeout : check.timeoutSeconds * 1000
    }

    // Instanciate the request object using either the http or https module
    const _moduleToUse = check.protocol == 'http' ? http : https
    const req = _moduleToUse.request(requestDetails, (res) => {
        // Grab the status of the sent request
        const status = res.statusCode        

        //Update the checkoutcome and pass the data along 
        checkOutcome.responseCode = status
        if(!outcomeSent) {
            worker.processCheckOutcome(check, checkOutcome)
            outcomeSent = true
        }
    })

    // Bind to the error event so it does not get thrown
    req.on('error', err => {
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            error : true,
            value : err
        }

        if(!outcomeSent) {
            worker.processCheckOutcome(check, checkOutcome)
            outcomeSent = true
        }
    })
    
    // Bind to the timeout event 
    req.on('timeout', err => {
        // Update the checkOutcome and pass the data along
        checkOutcome.error = {
            error : true,
            value : 'timeout'
        }

        if(!outcomeSent) {
            worker.processCheckOutcome(check, checkOutcome)
            outcomeSent = true
        }
    })

    // End the request
    req.end()
 }

 // Process the check outcome and update the check data as needed and trigger an alert if needed
 // Special logic for accomodating a check that has never been tested before (do not alert on that one )

 worker.processCheckOutcome = (check, checkOutcome) => {
    // Decide if the check is considered up or down
    console.log(!checkOutcome.error && checkOutcome.responseCode && check.successCode.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down')
    const state = !checkOutcome.error && checkOutcome.responseCode && check.successCode.indexOf(checkOutcome.responseCode) > -1 ? 'up' : 'down'
 
    // Decide if an alert is warrented
    const alertWarranted = check.lastChecked && check.state !== state ? true : false

    // Log the outcome
    const timeOfCheck = Date.now()      

    worker.log(check,checkOutcome,state,alertWarranted,timeOfCheck);

    // Update the check data 
    const newCheckData = check
    newCheckData.state = state
    newCheckData.lastChecked = Date.now()


    // Save the updates
    _data.update('check', newCheckData.id, newCheckData, (err) => {
        if(err) {
            console.log('Error trying to save updates to one of the checks')
        }

        // Send the new check data to the next step in the process if needed
        if(!alertWarranted) {
            console.log('check outcome has not changed, no alert needed')
        } else { 
            worker.alertUserToStatusChange(newCheckData)
        }
    })
      
 }

 // Alert the user as to change in their check status
 worker.alertUserToStatusChange = check => {

    const message = `Alert - Your check for ${check.method.toUpperCase()} ${check.protocol}://${check.url} is currently ${check.state}`;

    sendTwilioSms(check.userPhone, message, err => {
        if(!err) {
            console.log('Success: User was alerted to a status change in their check via sms ', message)
        } else { 
            console.log('Error: Could not send alert to user')
        }
    })
 }
 // Params original check, check outcome, state, alert Warrented, timeOfCheck
 worker.log = (check, outcome, state, alert, time) => {
    // Form the log data
    const logData = { check, outcome, state, alert, time }

    // Convert data to a string
    const logString = JSON.stringify(logData)

    // Determine the name of the log file
    const logFileName = check.id

    // Append the log string to a file 
    _log.append(logFileName, logString, err => {
        if(!err) {
            console.log('Logging to a file succeded')
        } else {
            console.log('Logging to file failed')
        }
    })
 }

 // Timer to execute the worker-process once per minute
 worker.loop = () => {
    setInterval(() => {
        worker.gatherAllChecks()
    }, 1000 * 60)
}

// Rotate (compress) the log files
worker.rotateLogs = () => {
    // List all the (none compress) log files 
    _log.list(false, (err, log) => {
        if(!err && log && log.length > 0) {
            log.forEach(log => {
                // Compress the date to a different file 
                const logId = log.replace('.log', '')
                const newFileId = `${logId}-${Date.now()}`
                _log.compress(logId, newFileId, err => {
                    if(!err) {
                        // Truncate the log 
                        _log.truncate(logId, err => {
                            if(!err) {
                                console.log('Success truncating log file')
                            } else {
                                console.log('Error truncating log file')
                            }
                        })
                    } else {
                        console.log('Error compressing one of the log files ', err)
                    }
                })
            })
        } else { 
            console.log('Error : could not find any logs to rotate')
        }
    })
}

// Timer to execute the worker-process once per minute
worker.logRotationLoop = () => {
     setInterval(() => {
         worker.rotateLogs()
     }, 1000 * 60 * 60 * 24)

 }


// Init script
 worker.init = () => {

    // Send to console in yellow
    console.log('\x1b[33m%s\x1b[0m', 'Background workers are running')

    // Execute all the checks immediatly
    worker.gatherAllChecks()

    // Call the loop so the checks will execute later on 
    worker.loop()

    // Compress all the logs immedialy
    worker.rotateLogs()

    // Call the compresion loop so logs wwill be compress later on
    worker.logRotationLoop()
 }

 // Export the module
 module.exports = worker