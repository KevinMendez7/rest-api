/*
 * TEST RUNNER
 *
 */

// Overrides the NODE_ENV variable
process.env.NODE_ENV = 'testing'


// Application logic for the test runner
_app = {}

// Container for the test
_app.test = {}

// Add on unit test
_app.test.unit = require('./unit')
_app.test.api = require('./api')

// Count all the test
_app.countTest = () => {
    let counter = 0
    for(let key in _app.test) {
        if(_app.test.hasOwnProperty(key)) {
            const subTests = _app.test[key]
            for(let name in subTests) {
                if(subTests.hasOwnProperty(name)) {
                    counter++
                }
            }
        }
    }
    return counter
}

// Produce a test output report 
_app.produceTestReport = (limit, successes, error) => {
    console.log('')
    console.log('---------------BEGIN TEST REPORT------------------')
    console.log('')
    console.log('Total Tests: ', limit)
    console.log('Pass: ', successes)
    console.log('Fail: ', error.length)
    console.log('')

    // If there are errors, print them in detail
    if(error.length > 0) {
        console.log('---------------BEGIN ERROR DETAILS------------------')
        console.log('')
        
        error.forEach(err => {
            console.log('\x1b[31m%s\x1b[0m', err.name)
            console.log(err.error)
            console.log('')
        });
        
        console.log('')
        console.log('---------------END ERROR DETAILS------------------')
    }

    console.log('')
    console.log('---------------END TEST REPORT------------------')
    process.exit(0)
}

// Run all the tests, collecting the errors and successes
_app.runTest = () =>{
    const errors = []
    let successes = 0
    const limit = _app.countTest()
    let counter = 0
    for(let key in _app.test) {        
        if(_app.test.hasOwnProperty(key)) {
            const subTests = _app.test[key]
            for(let name in subTests) {                
                if(subTests.hasOwnProperty(name)) {
                    (function() {
                        const tmpTestName = name
                        const testValue = subTests[name]

                        // Call the test
                        try {
                            testValue(()=> {
                                // If it callsback without throwing, then it succeeded, so log it in green
                                console.log('\x1b[32m%s\x1b[0m', tmpTestName)
                                counter++
                                successes++
                                if(counter == limit) {
                                    _app.produceTestReport(limit, successes, errors)
                                }
                            })
                        } catch(error) {
                            // If it throws, then it failed, so capture the error thrown and log it in red
                            errors.push({ name, error })
                            console.log('\x1b[31m%s\x1b[0m', tmpTestName)
                            counter++
                            if(counter == limit) {
                                _app.produceTestReport(limit, successes, errors)
                            }
                        }
                    })()
                }
            }
        }
    }
}

// Run the test

_app.runTest()