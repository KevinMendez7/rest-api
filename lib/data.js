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

// Read data from file
lib.read = (dir, file, cb) => {
    fs.readFile(`${lib.baseDir}${dir}/${file}.json`,'utf8', (err, data) => {
        cb(err, data)
    })
}

// Update data from file
lib.update = (dir, file, data, cb) => {

    //Open the file for writing
    fs.open(`${lib.baseDir}${dir}/${file}.json`, 'r+', (err, fileDescriptor) => {
        if(err) {
            cb(err)
        }

        const stringData = JSON.stringify(data)

        //Truncate the file
        fs.ftruncate(fileDescriptor, (err) => {
            if(err) {
                cb(err)
            }
        })        

        //Write and close the file
        fs.write(fileDescriptor, stringData, (err) => {
            if(err) {
                cb(err)
            }

            //Closing the file
            fs.close(fileDescriptor, (err) => {
                err ? cb(err) : cb(false)
            })
        })
        
    })

}

//Delete a file
lib.delete = (dir, file, cb) => {
    //Unlink the file   
    fs.unlink(`${lib.baseDir}${dir}/${file}.json`, (err) => {
        err ? cb(err) : cb(false)        
    })
}


//export lib function
module.exports = lib