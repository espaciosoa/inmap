const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RoomMeasurementSchema = new Schema({

    roomId: {type: mongoose.Schema.Types.ObjectId, ref: 'Room'},
    timestamp : String,
    position: mongoose.Schema.Types.Mixed,
    signalMeasurement: mongoose.Schema.Types.Mixed

}, {
    versionKey: false,
    strict: false
})

// DAO
// const RoomMeasument = mongoose.model('RoomMeasurement', RoomMeasurementSchema);


module.exports = {
    Schema: RoomMeasurementSchema
};
