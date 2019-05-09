const fs = require('fs-extra')
const Validator = require('jsonschema').Validator
const v = new Validator()
const models = require('../models/');

exports.importSQL = filename => {
    console.log(`importSQL start: ${filename}`)
    return new Promise((resolve, reject) => {
        console.log(`importSQL promise: ${filename}`)
        fs.readFile(filename, 'utf8').then(arraySplit).then(runQueries).then(() => {
            console.log(`importSQL done: ${filename}`)
            resolve('all tables created')
        }).catch(err => {
            console.log(`error with: ${filename}`)
            console.log(err)
            reject(`error: ${err}`)
        })
    })
}

function arraySplit(str) {
    console.log('arraySplit')
    return new Promise((resolve, reject) => {
        if (str.indexOf(';') === -1) {
            return reject('each SQL statement must terminate with a semicolon (;)')
        }
        str = str.trim()
        str = str.replace(/--*(\n|\r)/g, ' ')
        str = str.replace(/(?:\r\n|\r|\n)/g, ' ')
        str = str.replace(/\s\s+/g, ' ').trim()
        str = str.substring(0, str.length - 1)
        //let arr = str.split(';');
        let arr = str.split(';').map(v => {
            return v.replace(/--.*-+/g, ' ').replace(/CREATE TABLE\s/g, 'CREATE TABLE IF NOT EXISTS ').trim()
                // return v.replace(/.*DROP\s/g, 'DROP ').replace(/--.*/g, ' ').replace(/\n\r/g,'').trim()
        })

        for (var i = 0; i < arr.length; i++) {
            if (arr[i] == "") {
                arr.splice(i, 1);
                i--;
            }
        }
        resolve(arr)
    })
}

function runQueries(arr) {
    console.log('connecting to database')

    Promise.all(arr.map(item => {
        console.log(item)
        models.sequelize.query(item, (err, rows) => {
            if (err) {
                throw 'ERROR: ' + err
            }
            return 'ROWS: ' + rows
        })
    })).then(() => {
        console.log('DONE!')
    }, (e) => {
        console.log(`error: ${e}`)
    })
}