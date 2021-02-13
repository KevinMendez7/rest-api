/*
 * library for storing and editing data
 *
 */

// Dependencies
const fs = require('fs')
const path = require('path')


// Containter for the module to be exported
let lib = {}

// Base directory of the .data folder
lib.baseDir = path.join(__dirname, '/../.data/')


// Write data to a file
lib.create = (dir, file, data, cb) => {

    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'wx', (err, fileDescriptor) => {
        if(err) {
            console.log('ERRRRRRRRRROOOOOOORRRRR AQUI')
            cb(err)
        }

        //Convert data to string
        const stringData = JSON.stringify(data)

        // Write file and close it

        fs.write(fileDescriptor, stringData, (err) => {
            if(err){
                cb(err)
            }

            fs.close(fileDescriptor, (err) => {
                if(err) {
                    cb(err)
                }

                cb(false)
            })
        })
    })

}


//export lib function
module.exports = lib