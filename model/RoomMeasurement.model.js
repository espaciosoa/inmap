const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RoomMeasurementSchema = new Schema({


}, {
    versionKey: false,
    strict: false
})

// DAO
// const RoomMeasument = mongoose.model('RoomMeasurement', RoomMeasurementSchema);


module.exports = {
    Schema: RoomMeasurementSchema
};
