/*
 * API TEST
 *
 */

// Dependencies 
const assert = require('assert')
const http = require('http')
const app = require('../index')
const config = require('../lib/config')

// Holder for the api tests
const api = {}

// Helpers
const helper = {}

helper.getRequest = (path, cb) => {
    // Configure the request details
    const options = {
        protocol : 'http:',
        hostname : 'localhost',
        method : 'GET',
        port : config.httpPort,
        path,
        headers : {
            'Content-Type' : 'application/json'
        }
    }

    // Send the request
    const req = http.request(options, (res) => {
        cb(res)
    })

    req.end()
}

// The main init() function should be able to run without throwing
api['app.init should start without throwing'] = (done) => {
    assert.doesNotThrow(() => {
        app.init((err) => {
            done()
        })
    }, TypeError)
}

// Make a request to /ping
api['/ping should respond to GET with code 200'] = (done) => {
    helper.getRequest('/ping', (res) => {
        assert.equal(res.statusCode, 200)
        done()
    })
}

// Make a request to /api/users
api['/api/users should respond to GET with code 400'] = (done) => {
    helper.getRequest('/api/users', (res) => {
        assert.equal(res.statusCode, 400)
        done()
    })
}

// Make a request to random path
api['random path should respond to GET with code 404'] = (done) => {
    helper.getRequest('/this/path/doesnot/exist', (res) => {
        assert.equal(res.statusCode, 404)
        done()
    })
}

// Exports the module for test runner
module.exports = api
