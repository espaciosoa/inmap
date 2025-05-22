const mongoose = require('mongoose')
const Schema = mongoose.Schema
const { v4: uuidv4 } = require('uuid');
const RoomMeasurementSchema = new Schema({
    _id: {
        type: String,
        default: uuidv4,
    },
    roomId: { type: String, ref: 'Room' },
    timestamp: {
        type: String,
        required: [true, 'timestamp should be provided is required']
    },
    position: mongoose.Schema.Types.Mixed,
    signalMeasurement: mongoose.Schema.Types.Mixed,
    measurementDevice: {
        type: String,
        required: [true, 'measurementDevice is required']
    },
    version: {
        type: Number,
        default: 1
    }
}, {
    versionKey: false,
    strict: false
})

// DAO
// const RoomMeasument = mongoose.model('RoomMeasurement', RoomMeasurementSchema);


module.exports = {
    Schema: RoomMeasurementSchema
};
