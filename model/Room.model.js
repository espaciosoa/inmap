const mongoose = require('mongoose')
const { v4: uuidv4 } = require('uuid');

const RoomSchema = new mongoose.Schema({
    
    _id: {
        type: String,
        default: uuidv4,
      },
    // _id : {type: mongoose.Schema.Types.ObjectId},
    name: {type:String, required: true},
    version: {
        type: Number,
        default: 1
    }
}, {
    versionKey: false,
    strict: false
});


//DAO -> I'm doing this part now in the allModels.js loader
// const Room = mongoose.model('Room', RoomSchema)

module.exports = {
    Schema: RoomSchema
}