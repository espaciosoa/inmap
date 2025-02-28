const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid');

const { Room } = require("../../model/allModels")

const { authMiddleware } = require("./middlewares/Middlewares.md")

// Define routes for all REST methods
router.get('/', async (req, res) => {
  const allRooms = await Room.find({}).exec()
  res.json(allRooms)

});


router.post('/', [authMiddleware], async (req, res) => {




  console.log('POST Room', req.body);
  console.log("Headers", req.headers)
  //- Parse the request



  // Check for name of room
  const room_IncomingObject = req.body
  delete room_IncomingObject["remoteSync"]
  delete room_IncomingObject["roomId"]


  console.log(room_IncomingObject)

  //Check if exists already something with that name
  const roomExists = await Room.find({ name: room_IncomingObject.name }).select({ name: 1, _id: 1 }).exec()

  console.log(roomExists)

  if (roomExists && roomExists.length > 0)
    return res.status(200).json(roomExists)

  const nuRoomID = uuidv4()

  //CREAR OBJETO CON NEW
    nuRoom = await new Room({
      ...room_IncomingObject,
      "_id": nuRoomID,
    }
  ) 
  //.SAVE
  const insertedRoom = await nuRoom.save()
  console.log(insertedRoom)


  res.json(insertedRoom);
});


// Catch-all route for unsupported methods
router.all('*', (req, res) => {
  res.status(405).send(`Method ${req.method} not allowed`);
});








module.exports = router