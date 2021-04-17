/*
 * Library for storing and rotating logs
 *
 */

 // Dependencies
 const fs = require('fs')
 const path = require('path')
 const zlib = require('zlib')

 // Container for the module
 const lib = {}

 // Base directory of the .logs folder
lib.baseDir = path.join(__dirname, '/../.logs/')

// Append a string to a file. Create the file if it does not exists
 lib.append = (fileName, data, cb) => {
     //Open the file for appending
     fs.open(`${lib.baseDir}${fileName}.log`,'a', (err, fileDescriptor) => {
         if(!(!err && fileDescriptor)){
            return cb('Could not open the file for appending')
         } else {
            fs.appendFile(fileDescriptor, `${data} \n`, err => {
                if(err) {
                    return cb('Error appending to file')
                }

                fs.close(fileDescriptor, err => {
                    if(err) {
                        return cb('Error closing file that was being appending')
                    }

                    return cb(false)
                })
            } )
         }
     })

     
    }
    
    // List all the logs and optionally include the compressed logs
    lib.list = (includeCompressedLogs, cb) => {
        fs.readdir(lib.baseDir, (err, data) => {
           if(!(!err && data && data.length > 0)) {
               return cb(err, data)
           }

           const trimmedFileNames = []
           data.forEach(fileName => {
               // Add the .log files
               if(fileName.indexOf('.log') > -1) {
                   trimmedFileNames.push(fileName.replace('.log', ''))
               }
               
               // Add the .gz files
               if(fileName.indexOf('.gz.b64') > -1 && includeCompressedLogs) {
                   trimmedFileNames.push(fileName.replace('.gz.b64', ''))
               }
           })

           cb(false, trimmedFileNames)
        })
    }

    // Compress the contents of one .log files into .gz.b64 within the same directory
    lib.compress = (logId, newFileId, cb) => {
        const sourceFile = `${logId}.log`
        const destFile = `${newFileId}.gz.b64`

        // Read the source file 
        fs.readFile(lib.baseDir + sourceFile, 'utf8', (err, inputString) => {
            if(!(!err && inputString)) {
                return cb(false)
            }

            // Compress the data using gzip
            zlib.gzip(inputString, (err, buffer) => {
                if(!(!err && buffer)){
                    return cb(err)
                }

                // Send the data to the destination file
                fs.open(lib.baseDir + destFile, 'wx', (err, fileDescriptor) => {
                    if(!(!err && fileDescriptor)) {
                        return cb(err)
                    }

                    // Write the destination file
                    fs.write(fileDescriptor, buffer.toString('base64'), err => {
                        if(err) {
                            return cb(err)
                        }

                        //Close the destination file
                        fs.close(fileDescriptor, err => {
                            if(err) {
                                return cb(err)
                            }

                            cb(false)
                        })
                    })
                })
            })
        })
    }

    // Decompress the content of .gz.b64 into string variable
    lib.decompress = (fileId, cb) => {
        const fileName = fileId + '.gz.b64'
        fs.readFile(lib.baseDir + fileName, 'utf8',  (err, string) => {
            if(!(!err && string)) {
                return cb(err)
            }

            // Decompress the data
            const inputBuffer = Buffer.from(string, 'base64')
            zlib.unzip(inputBuffer, (err, outputBuffer) => {
                if(!(!err && outputBuffer)) {
                    return cb(err)
                }

                // Callback 
                const string = outputBuffer.toString()
                cb(false, string)
            })
        })
    }

    // Truncate a log file
    lib.truncate = (logId, cb) => {
        fs.truncate(`${lib.baseDir}${logId}.log`, 0, err => {
            if(err) {
                cb(err)
            } else { 
                cb(false)
            }
        })
    }

 // Export the module
 module.exports = lib