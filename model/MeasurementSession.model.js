const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { v4: uuidv4 } = require('uuid');
const MeasurementSessionSchema = new Schema({
    _id: {
        type: String,
        default: uuidv4,
      },
    roomId:{
        type: String,
        ref:"Room"
    },
    origin: mongoose.Schema.Types.Mixed,
    timestamp: mongoose.Schema.Types.Mixed,
    measurementDevice: String, 
    measurementOwner:String,
    version: {
        type: Number,
        default: 1
    }

}, {
    versionKey: false,
    strict: false
})


module.exports = {
    Schema: MeasurementSessionSchema
};
