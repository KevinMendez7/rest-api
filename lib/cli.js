/*
 * CLI releated tasks
 *
 */

// Dependencies
const readline = require('readline')
const util = require('util')
const events = require('events');
const os = require('os')
const v8 = require('v8')
const childProcess = require('child_process')
const debug = util.debuglog('cli')
const _data = require('./data')
const _log = require('./log');
const helper = require('./helper');
class _events extends events{}
const e = new _events()

// Instantiate the CLI module object

const cli = {}

// Input handlers
e.on('man', () => cli.responders.help())
e.on('help', () => cli.responders.help())
e.on('exit', () => cli.responders.exit())
e.on('stats', () => cli.responders.stats())
e.on('list users', () => cli.responders.listUsers())
e.on('more user info', str => cli.responders.moreUserInfo(str))
e.on('list checks', str => cli.responders.listChecks(str))
e.on('more check info', str => cli.responders.moreCheckInfo(str))
e.on('list logs', () => cli.responders.listLogs())
e.on('more log info', str => cli.responders.moreLogsInfo(str))

// Responders object
cli.responders = {}

cli.responders.help = () => {
    const commands = {
        'exit': 'kill ths CLI(and the rest of the application)',
        'man': 'show this help page',
        'help': 'show this help page',
        'stats': 'Get statistics on the underlyng operating system and resource utilization',
        'list users': 'Show a list of all the registered (undeleted) users in the system',
        'more user info --{userId}': 'Show details of a specific user',
        'list checks --up --down': 'Show a list of all the active checks in the system, including their state, the "--up" and the "--down" flags are both optional',
        'more check info --{checkId}': 'Show details of a specific check',
        'list logs': 'Show a list of all the logs available to be read (compressed and decompressed)',
        'more log info --{fileName}': 'Show details of a specific log file',
    }

    // Show a header for the help page is as wide as the screen
    cli.horizontalLine()
    cli.centered('CLI MANUAL')
    cli.horizontalLine()
    cli.verticalSpace(2)

    // Show each command, followed by its explanation, in white and yellow respectively
    for(let key in commands) {
        if(commands.hasOwnProperty(key)){
            const value = commands[key]
            let line = `\x1b[33m${key}\x1b[0m`
            const padding = 60 - line.length
            for(let i = 0; i < padding; i ++) {
                line += ' '
            }
            line += value
            console.log(line)
            cli.verticalSpace()
        }
    }

    cli.verticalSpace(1)

    // End with another horizontal line
    cli.horizontalLine()
}

// Create a vertical space
cli.verticalSpace = lines => {
    lines = typeof(lines) == 'number' && lines > 0 ? lines : 1
    for(let i = 0; i < lines; i ++) {
        console.log('')
    }
}

// Crete horizontal line across the screen
cli.horizontalLine = () => {
    // Get the available screen size 
    const width = process.stdout.columns

    let line = ''
    for(let i = 0; i < width; i++) {
        line += '-'
    }

    console.log(line)
}

// Create a center text on the screen
cli.centered = str => {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : ''

    const width = process.stdout.columns

    // Calculate the left padding there should be
    const leftPadding = Math.floor((width - str.length) / 2)

    // Put in left padded spaces before the string itself

    let line = ''
    for(let i = 0; i < leftPadding; i ++) {
        line += ' '
    }
    line += str
    console.log(line)
}

cli.responders.exit = () => process.exit(0)
``
cli.responders.stats = () => {
    // Compile an object of stats
    const stats = {
        'load Average' : os.loadavg().join(' '),     
        'CPU Count' : os.cpus().length,     
        'Free Memory' : os.freemem(),     
        'Current Malloced Memory' : v8.getHeapStatistics().malloced_memory,     
        'Peak Malloced Memory' : v8.getHeapStatistics().peak_malloced_memory,     
        'Allocated Heap Used (%)' : Math.round((v8.getHeapStatistics().used_heap_size / v8.getHeapStatistics().total_heap_size) * 100),     
        'Available Heap Allocated (%)' : Math.round((v8.getHeapStatistics().total_heap_size / v8.getHeapStatistics().heap_size_limit) * 100),     
        'Uptime' : `${os.uptime()} Seconds`,     
    }

    // Show a header for stats
    cli.horizontalLine()
    cli.centered('System Statistics')
    cli.horizontalLine()
    cli.verticalSpace(2)

    // Log out each stats
    for(let key in stats) {
        if(stats.hasOwnProperty(key)){
            const value = stats[key]
            let line = `\x1b[33m${key}\x1b[0m`
            const padding = 60 - line.length
            for(let i = 0; i < padding; i ++) {
                line += ' '
            }
            line += value
            console.log(line)
            cli.verticalSpace()
        }
    }

    cli.verticalSpace(1)
}
cli.responders.listUsers = () => {    
    _data.list('user', (err, userIds) => {        
        if(!err && userIds && userIds.length > 0) {            
            cli.verticalSpace()
            userIds.forEach(userId => {                
                _data.read('user', userId, (err, userData) => {                    
                    if(!err && userData) {
                        let line = `Name: ${userData.firstName} ${userData.lastName} Phone: ${userData.phone} Checks:`                        
                        const numberOfChecks = typeof(userData.check) == 'object' && userData.check instanceof Array && userData.check.length > 0 ? userData.check.length : 0
                        line += numberOfChecks
                        console.log(line)                        
                    }
                })
            })
        }
    })
    cli.verticalSpace()
}

cli.responders.moreUserInfo = (str) => {
    // Get the ID from the string
    const arr = str.split('--')
    const userId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1] : false
    if(userId) {
        // Lookup the user
        _data.read('user', userId, (err, userData) => {
            if(!err && userData) {
                // Remove the hashed password
                delete userData.password

                // Print the JSON with text highlighting
                cli.verticalSpace()
                console.dir(userData, { colors : true })
                
            }
        })

        
    }
    cli.verticalSpace()
}
cli.responders.listChecks = str => {
    _data.list('check', (err, checksIds) => {
        if(!err && checksIds && checksIds.length > 0) {
            cli.verticalSpace()
            checksIds.forEach(checkId => {
                _data.read('check', checkId, (err, checkData) => {
                    let includeCheck = false
                    const lowerString = str.toLowerCase()

                    // Get the state, default to down
                    const state = typeof(checkData.state) == 'string' ? checkData.state : 'down'
                    // Get the state, default to unknown
                    const stateOrUnknown = typeof(checkData.state) == 'string' ? checkData.state : 'unknown'

                    // If the user has specified the state or has not specified any state, include the current check according 
                    if(str.indexOf(`--${state}`) > -1 || (lowerString.indexOf('--down') == -1 && lowerString.indexOf('--up') == -1)) {
                        let line = `ID: ${checkData.id} ${checkData.method.toUpperCase()} ${checkData.protocol}://${checkData.url} State : ${stateOrUnknown}`
                        console.log(line)
                        cli.verticalSpace()

                    }
                })
            })
        }
    })
}
cli.responders.moreCheckInfo = (str) => {
    // Get the ID from the string
    const arr = str.split('--')
    const checkId = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1] : false
    if(checkId) {
        // Lookup the check
        _data.read('check', checkId, (err, checkData) => {
            if(!err && checkData) {

                // Print the JSON with text highlighting
                cli.verticalSpace()
                console.dir(checkData, { colors : true })
                
            }
        })

        
    }
    cli.verticalSpace()
}
cli.responders.listLogs = () => {           
    const ls = childProcess.spawn('ls', ['./.logs/'])
    ls.stdout.on('data', (listObj) => {        
        const stringLogs = listObj.toString()
        const logFileNames = stringLogs.split('\n')
        logFileNames.forEach(logFileName => {
            if(typeof(logFileName) == 'string' && logFileName.trim().length > 0 && logFileName.indexOf('-') > -1) {
                console.log(logFileName.trim().split('.')[0])
                cli.verticalSpace()
            }
        })

    })
    
    // _log.list(true, (err, logFileNames) => {
    //     if(!err && logFileNames && logFileNames.length > 0) {
    //         cli.verticalSpace()
            // logFileNames.forEach(logFileName => {
            //     if(logFileName.indexOf('-') > -1) {
            //         console.log(logFileName)
            //         cli.verticalSpace()
            //     }
            // })
    //     }
    // })
}
cli.responders.moreLogsInfo = (str) => {
    // Get the logFileName from the string    
    const arr = str.split('--')
    const logFileName = typeof(arr[1]) == 'string' && arr[1].trim().length > 0 ? arr[1] : false
    if(logFileName) {
        cli.verticalSpace()
        // Decompress the log
        _log.decompress(logFileName, (err, logData) => {            
            if(!err && logData) {
                // Split into lines
                const arr = logData.split('\n')
                arr.forEach(jsonString => {
                    const logObject = helper.parseJSONtoObject(jsonString)
                    if(logObject && JSON.stringify(logObject) !== '{}'){
                        console.dir(logObject, { colors : true })
                        cli.verticalSpace()
                    }
                })
            }
        })
        
    }
    cli.verticalSpace()
}

// Input processor
cli.processInput = (str) => {
    str = typeof(str) == 'string' && str.trim().length > 0 ? str.trim() : false

    // Only procces the input if the user actually wrote something, otherwise ignore it
    if(str) {
        // COdify the unique strings that identify th unique questions allowed to the asked
        const uniqueInputs = [
            'man',
            'help',
            'exit',
            'stats',
            'list users',
            'more user info',
            'list checks',
            'more check info',
            'list logs',
            'more log info',
        ]

        // Go through the possible inputs, emit an event when a match is found
        let matchFound = false
        let counter = 0

        uniqueInputs.some(input => {
            if(str.toLowerCase().indexOf(input) > -1){
                matchFound = true
                // Emit an event matching the unique input and include the full string given by the user
                e.emit(input, str)
                return true
            }
        })

        // If no match is found, tell the user to try again
        if(!matchFound) {
            console.log('Sorry, try again')
        }

    }

}


// Init script
cli.init = () => {
    // Send the start message to the console, in dark blue
    console.log('\x1b[34m%s\x1b[0m', `The CLI  is running`)

    // Start the interface
    const _interface = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
        prompt: '>'
    })

    // Create an initial prompt
    _interface.prompt()

    // Handle each line of input separately
    _interface.on('line', (str) => {
        // Send to the input processor
        cli.processInput(str)

        // Re-initialize the prompt afterwards
        _interface.prompt()
    })

    // If the user stops the CLI, kill the associeted process
    _interface.on('close', () => {
        process.exit(0)
    })
}

// Export the module
module.exports = cli