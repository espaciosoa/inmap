const mongoose = require('mongoose')


const RoomSchema = new mongoose.Schema({
    // _id : {type: mongoose.Schema.Types.ObjectId},
    name: {type:String, required: true},
}, {
    versionKey: false,
    strict: false
});


//DAO -> I'm doing this part now in the allModels.js loader
// const Room = mongoose.model('Room', RoomSchema)

module.exports = {
    Schema: RoomSchema
}