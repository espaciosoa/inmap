const express = require('express')
const router = express.Router()
const { isEmptyObject } = require("../../shared/basic.validation")
const { v4: uuidv4 } = require('uuid');


const { RoomMeasurement } = require("../../model/allModels")

// Define routes for all REST methods
router.get('/', async (req, res) => {
  const allMeasurements = await RoomMeasurement.find({}).exec()
  res.json(allMeasurements)
});


router.get("/query", async (req, res) => {


  const supportedFieldFilters = ["roomId", "measurementSession"];
  const queryFieldsFilterObject = supportedFieldFilters.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(req.query, key)
      && req.query[key] !== undefined) {
      acc[key] = req.query[key];
    }
    return acc;
  }, {});

  const supportedOptions = ["limit", "sort"]
  const queryOptionsFilters = supportedOptions.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(req.query, key)
      && req.query[key] !== undefined) {
      acc[key] = req.query[key];
    }
    return acc;
  }, {});

  try {

    if (isEmptyObject(queryFieldsFilterObject) && isEmptyObject(queryFieldsFilterObject))
      throw new Error("No parameters specified for query endpoint")

    const results = await RoomMeasurement.find(
      queryFieldsFilterObject,
      null,
      queryOptionsFilters
    )

    return res.status(200).json(
      {
        success: true,
        // query: queryFieldsFilterObject,
        // options: queryOptionsFilters,
        data: results
      }
    )

  }
  catch (error) {

    res.status(500).json({
      success: false,
      message: `Something went wrong.\n
      Supported Field Filters: ${supportedFieldFilters.reduce((acc, curr, idx, arr) => {
        return acc = acc + ((idx < arr.length && idx > 0) ? "," : "") + curr
      }, '')}
      Supported Options: ${supportedOptions.reduce((acc, curr, idx, arr) => {
        return acc = acc + ((idx < arr.length && idx > 0) ? "," : "") + curr
      }, '')}
      ${error.message}`
    })
  }


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

  let nuRoomMeasurement
  if (incoming_RoomMeasurement.measurementDevice !== "RaspberryPi4B") {
    nuRoomMeasurement = new RoomMeasurement({
      ...incoming_RoomMeasurement,
      fullCellSignalStrength: JSON.parse(incoming_RoomMeasurement.signalMeasurement.fullCellSignalStrength),
      fullCellIdentity: JSON.parse(incoming_RoomMeasurement.signalMeasurement.fullCellIdentity),
      _id: roomMeasurementId
    })
  }
  else {
    nuRoomMeasurement = new RoomMeasurement({
      ...incoming_RoomMeasurement,
      measurementSession: "UNASSIGNED",
      //COMPLETE ME WITH THE PROCESSING OF RASPBERRY PI MEASUREMENTS
      _id: roomMeasurementId
    })

  }

  const insertedMeasurement = await nuRoomMeasurement.save()

  console.log("Recorded new measurement : " + Date.now().toLocaleString())

  res.json(insertedMeasurement);
});




// Catch-all route for unsupported methods
router.all('*', (req, res) => {
  res.status(405).send(`Method ${req.method} not allowed`);
});








module.exports = router