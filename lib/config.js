/*
*   Create and export configuration variables
*
*/

// Container for all environments
const environments = {}

// Staging (default) environment
environments.staging = {
    httpPort : 3000,
    httpsPort : 3001,
    envName : 'staging',
    hashingSecret : 'marcianosdev',
    maxCheck : 5,
    twilio : {
        accountSId : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        authToken : '9455e3eb3109edc12e3d8c92768f7a67',
        from : '+15005550006'
    },
    templateGlobals : {
        appName: 'UptimeChecker',
        companyName: 'BWOLF',
        yearCreated: '2021',
        baseUrl: 'http://localhost:3000/'
    }
}

// Production environment
environments.production = {
    httpPort : 5000,
    httpsPort : 5001,
    envName : 'production',
    hashingSecret : 'marcianospro',
    maxCheck : 5,
    twilio : {
        accountSId : 'ACb32d411ad7fe886aac54c665d25e5c5d',
        authToken : '9455e3eb3109edc12e3d8c92768f7a67',
        from : '+15005550006'
    },
    templateGlobals : {
        appName: 'UptimeChecker',
        companyName: 'BWOLF',
        yearCreated: '2021',
        baseUrl: 'http://localhost:5000/'
    }
}

// Determine wich environment was passed as a command-line argument
const currentEnvironment = typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : ''

// Check that the current environment is one of the environments avobe, if not, default to staging
const environment = typeof(environments[currentEnvironment]) == 'object' ? environments[currentEnvironment] : environments.staging

module.exports = environment