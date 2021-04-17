/*
 * UNIT TEST
 *
 */

// Dependencies 
const helper = require('../lib/helper')
const assert = require('assert')
const log = require('../lib/log')

// Holder for tests
const unit = {}

// Assert that the getNumber function is returning a number
unit['helpers.getNumber should return a number'] = (done) => {
    const val = helper.getNumber()
    assert.equal(typeof(val), 'number')
    done()
}

// Assert that the getNumber function is returning 1
unit['helpers.getNumber should return 1'] = (done) => {
    const val = helper.getNumber()
    assert.equal(val, 1)
    done()
}

// Assert that the getNumber function is returning 2
unit['helpers.getNumber should return 2'] = (done) => {
    const val = helper.getNumber()
    assert.equal(val, 2)
    done()
}

// Logs.list should callback an array and a false error
unit['logs.list should callback a false error and an array of log names'] = (done) => {
    log.list(true, (err, logNames) => {
        assert.equal(err, false)
        assert.ok(logNames instanceof Array)
        assert.ok(logNames.length > 1)
        done()
    })
}

// Logs.truncate should not throw if the logId does not exist
unit['logs.truncate should not throw if the logId does not exist, it should callback and error instead'] = (done) => {
    assert.doesNotThrow(() => {
        log.truncate('I do not exist', (err) => {
            assert.ok(err)
            done()
        })
    }, TypeError)
}

// Export test unit module
module.exports = unit