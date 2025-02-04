/**
 * @fileoverview This file is the database connection file.
 **/


const mongoose = require("mongoose");



/**
 * Returns the Mongoose instance (having established the default connection)
 * @param {string} ip : where the database is hosted
 * @param {string|number} port : the port of the database
 * @param {string} dbName : the name of the database to access
 * @returns {Promise<*|undefined>}
 */
function dbDefaultConnect(ip, port, dbName) {

    const dbUri = `mongodb://${ip}:${port}/${dbName}`;


    

    const init = async () => {
        try {
            return await mongoose.connect(dbUri, {
                autoIndex: true,
                useNewUrlParser: true,
                useUnifiedTopology: true
            });
        } catch (error) {
            console.error(`ERROR connection to ${dbUri} : ${error}`);
        }
    };
    
    return init();
}

module.exports = dbDefaultConnect;

