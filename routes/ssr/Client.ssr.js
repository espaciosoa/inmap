const express = require('express')
const router = express.Router()


// Define routes for all REST methods
router.get('/', async (req, res) => {
  
  
//     const allRooms = await Room.find({}).exec()
//   const allMeasurements = await RoomMeasurement.find({}).exec()
//   res.json({rooms:allRooms, measurements: allMeasurements})
  res.sendfile("./client/test-leaflet.html");
});


module.exports = router