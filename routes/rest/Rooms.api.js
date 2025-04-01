const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid');

const { Room, MeasurementSession, RoomMeasurement } = require("../../model/allModels")

const { authMiddleware } = require("./middlewares/Middlewares.md")

// Define routes for all REST methods
router.get('/', async (req, res) => {
  const allRooms = await Room.find({}).exec()
  res.json(allRooms)

});


//Given a Room id, obtains al related information
router.get("/:roomId", async (req, res) => {

  const { roomId } = req.params
  let result = {}

  console.log(roomId)
  try {
    const matchingRoom = await Room.findOne({ _id: roomId });

    // console.log(matchingRoom)
    if (!matchingRoom)
      return res.status(404).json({ message: "Room not found" })

    result["room"] = matchingRoom;
    const itsSessions = await MeasurementSession.find({ roomId: roomId });
    // console.log(itsSessions.length)
    result["sessions"] = []
    for (s of itsSessions) {

      const aSessionMeasurements = await RoomMeasurement.find({ measurementSession	: s._id });
      result["sessions"].push(
        {
          session: s,
          measurements: aSessionMeasurements
        }
      )

    }
    // console.log(result)

  }
  catch (e) {
    return res.status(500).json({ message: e.message })
  }


  return res.status(200).json(result)


})




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
  const roomExists = await Room.find({ name: room_IncomingObject.name.trim() }).select({ name: 1, _id: 1, version: 1 }).exec()


  console.log(`YA EXISTE ESA SALA? ${roomExists ? "SI" : "NO"}`)
  console.log(roomExists)




  if (roomExists && roomExists.length > 0) {
    console.log("Returned already existing element")
    return res.status(200).json(roomExists[0])
  }

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



router.put("/", [authMiddleware], async (req, res) => {
  throw new Error("NotImplemented")
})

router.delete("/", [authMiddleware], async (req, res) => {
  throw new Error("NotImplemented")
})





// Catch-all route for unsupported methods
router.all('*', (req, res) => {
  res.status(405).send(`Method ${req.method} not allowed`);
});








module.exports = router