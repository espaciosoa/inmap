const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid');


const { RoomMeasurement } = require("../../model/allModels")

// Define routes for all REST methods
router.get('/', async (req, res) => {
  const allMeasurements = await RoomMeasurement.find({}).exec()
  res.json(allMeasurements)
});

router.post('/', async (req, res) => {
  console.log('POST /RoomMeasurements');


  const incoming_RoomMeasurement = req.body


  //Remove unnecesary stuff
  delete incoming_RoomMeasurement["remoteSync"]




  // incoming_RoomMeasurement[] = 
  // incoming_RoomMeasurement.fullCellIdentity = 

  // console.log(incoming_RoomMeasurement)

  //TODO: check that the measurements are associated to an existing session and existing room
  const roomMeasurementId = uuidv4()

  const nuRoomMeasurement = new RoomMeasurement({
    ...incoming_RoomMeasurement,
    fullCellSignalStrength: JSON.parse(incoming_RoomMeasurement.signalMeasurement.fullCellSignalStrength),
    fullCellIdentity:JSON.parse(incoming_RoomMeasurement.signalMeasurement.fullCellIdentity),
    _id: roomMeasurementId
  })

  const insertedMeasurement = await nuRoomMeasurement.save()

  console.log("Recorded new measurement : "+ Date.now().toLocaleString())

  res.json(insertedMeasurement);
});

// Catch-all route for unsupported methods
router.all('*', (req, res) => {
  res.status(405).send(`Method ${req.method} not allowed`);
});








module.exports = router