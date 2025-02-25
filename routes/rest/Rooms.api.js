const express = require('express')
const router = express.Router()

const { Room, RoomMeasurement } = require("../../model/allModels")

// Define routes for all REST methods
router.get('/', async (req, res) => {
  const allRooms = await Room.find({}).exec()
  const allMeasurements = await RoomMeasurement.find({}).exec()
  res.json({rooms:allRooms, measurements: allMeasurements})
  // res.send('TODO: Show all database records');
});

router.post('/', async (req, res) => {
  console.log('POST Request Body:', req.body);

  //- Parse the request
  //- Check for special thing in the body and remove it, to "reject" request otherwise
  //- Check get info for a room . Check if one with the same name exists and update in case
  // Important to think about how to store data in the collection (all together has the problem of updating that is costly)

  // let id = new ObjectId(req.params.id);
  result = await testInsertMeasurements(req.body)


  res.json(result);
});

router.put('/', (req, res) => {
  console.log('PUT Request Body:', req.body);
  res.send('Received a PUT request');
});

router.delete('/', (req, res) => {
  res.send('Received a DELETE request');
});

router.patch('/', (req, res) => {
  console.log('PATCH Request Body:', req.body);
  res.send('Received a PATCH request');
});

// Catch-all route for unsupported methods
router.all('*', (req, res) => {
  res.status(405).send(`Method ${req.method} not allowed`);
});








module.exports = router