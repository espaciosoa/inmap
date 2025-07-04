const runninEnvironment = process.env.NODE_ENV ? process.env.NODE_ENV : "development"
require('dotenv').config({ path: `.env.${runninEnvironment}`, override: true });
const { Room, RoomMeasurement, MeasurementSession } = require("./src/model/allModels.js")

const readline = require('readline');


// ✅ TESTED
async function removeRoomByNameCascade(name) {
  const room = await Room.findOne({ name: name })
  if (!room) {
    return
  }
  console.log("About to remove room by name ", name)
  const deletedMeasurementsResult = await RoomMeasurement.deleteMany({ roomId: room._id })
  const deletedSessionsResult = await MeasurementSession.deleteMany({ roomId: room._id })
  const deletedRoomResult = await Room.deleteOne({ _id: room._id })

  return {
    deletedMeasurements: deletedMeasurementsResult.deletedCount,
    deletedSessions: deletedSessionsResult.deletedCount,
    deletedRooms: deletedRoomResult.deletedCount
  }
}


async function removeAllRoomsExceptCascade(blacklist) {
  const rooms = await Room.find({})

  if (!rooms) {
    return
  }


  let deletedMeasurementsResult, deletedSessionsResult, deletedRoomResult;
  for (const room of rooms) {
    if (!blacklist.includes(room.name)) {
      console.log("About to remove room and all its related data", room.name)
      deletedMeasurementsResult = await RoomMeasurement.deleteMany({ roomId: room._id })
      deletedSessionsResult = await MeasurementSession.deleteMany({ roomId: room._id })
      deletedRoomResult = await Room.deleteOne({ _id: room._id })
    }
    else {
      console.log(`Purposefully not removing room with name  ${room.name}`)
    }

  }


  return {
    deletedMeasurements: deletedMeasurementsResult?.deletedCount ?? 0,
    deletedSessions: deletedSessionsResult?.deletedCount ?? 0,
    deletedRooms: deletedRoomResult?.deletedCount ?? 0
  }
}




async function removeRoomCascade(id) {

  const deletedMeasurementsResult = await RoomMeasurement.deleteMany({ roomId: id })
  const deletedSessionsResult = await MeasurementSession.deleteMany({ roomId: id })
  const deletedRoomResult = await Room.deleteOne({ _id: id })


  return {
    deletedMeasurements: deletedMeasurementsResult.deletedCount,
    deletedSessions: deletedSessionsResult.deletedCount,
    deletedRooms: deletedRoomResult.deletedCount
  }
}

// borrar rooms vacías
async function removeUnlinkedData() {


  const allRooms = await Room.find({});


  const result = {}

  await Promise.all(allRooms.map(async room => {


    const numSessionsRoom = await MeasurementSession.countDocuments({ roomId: room._id })
    //get number of measurements 
    const numMeasurementsRoom = await RoomMeasurement.countDocuments({ roomId: room._id })


    //Si no hay sesiones 
    if (numSessionsRoom === 0 && numMeasurementsRoom > 0) {
      result[`${room.name}`] = {}
      console.log(`Found a room with no sessions. Deleting all measurements and room for cleanup '${room.name}'  `)
      result[`${room.name}`].resultDeleteSessions = await MeasurementSession.deleteMany({ roomId: room._id }).deletedCount
      result[`${room.name}`].resultDeleteMeasurements = await RoomMeasurement.deleteMany({ roomId: room._id }).deletedCount
      result[`${room.name}`].resultDeleteRoom = await room.deleteOne()
    }
  }
  ));

  return result

}



// ✅ TESTED
async function removeSessionCascade(id) {


  console.log(`Removing session ${id}`)

  const result = {};
  //Check if session  is the only one for a room
  const session = await MeasurementSession.findOne({ _id: id })
  if (!session) {
    console.warn(`No session found with ID ${id}`);
    return { deletedSessions: 0, deletedMeasurements: 0 };
  }

  const roomId = session.roomId  // The room being measured
  //Check if there is only a single session for this room, and thus delete the room
  const isOnlySessionRoom = (_roomId) => MeasurementSession.countDocuments({ roomId: _roomId })
  if (await isOnlySessionRoom(roomId))
    return removeRoomCascade(roomId)
  else {
    result.deletedMeasurements = (await RoomMeasurement.deleteMany({ sessionId: id })).deletedCount
    result.deletedSessions = (await MeasurementSession.deleteMany({ _id: id })).deletedCount
  }


  return result



}


async function removeAll() {

  const resultDeleteMeasurements = await RoomMeasurement.deleteMany({}).exec()
  const resultDeleteSessions = await MeasurementSession.deleteMany({}).exec()
  const resultDeleteRooms = await Room.deleteMany({}).exec()

  return {
    deletedMeasurements: resultDeleteMeasurements.deletedCount,
    deletedSessions: resultDeleteSessions.deletedCount,
    deletedRooms: resultDeleteRooms.deletedCount
  }

}



const isSingleRepeatedDigit = (str) => /^([a-zA-Z0-9])\1*$/.test(str)
//MOVE ME 
// Checks for useless and test data in the db that can be deleted
async function listUselessData(askForFixInteractively = false) {

  const allRooms = await Room.find({})

  // Explore all rooms and the corresponding measurements
  for (const r of allRooms) {

    if (r.name.length < 2) {
      console.log("🤖 Checking for short names...")
      console.warn(`t⚠️ Room ${r.name} with id ${r._id} has a super short name, it's possibly a test`)

      if (askForFixInteractively) {
        const confirmed = await askConfirmation("Delete? ")
        const result = confirmed ? await removeRoomCascade(r._id) : "Not removed"
        console.log(result)

        continue;
      }
    }

    // Check names like "aaaa", same letter repeated
    if (isSingleRepeatedDigit(r.name)) {
      console.warn(`⚠️ Room ${r.name} with id ${r._id} looks like a test. Consider deleting it`)
      if (askForFixInteractively) {
        const confirmed = await askConfirmation("Delete? ")
        const result = confirmed ? await removeRoomCascade(r._id) : "Not removed"
        console.log(result)
        continue;
      }
    }

    const allSessionsForRoom = await MeasurementSession.find({ roomId: r })

    for (const s of allSessionsForRoom) {

      const measurementsForSession = await RoomMeasurement.countDocuments({ measurementSession: s._id })

      if (measurementsForSession < 20) {
        console.warn(`⚠️ Session ${s._id} (associated to room '${r.name}') has ${measurementsForSession} measurements, which is not a lot. It is possibly a test`)
        if (askForFixInteractively) {
          const confirmed = await askConfirmation("Delete? ")
          const result = confirmed ? await removeSessionCascade(s._id) : "Not removed"
          console.log(result)

        }
      }
    }


  }


  //Check unlinked measurements
  //TODO




}


function askQuestion(prompt) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => rl.question(prompt, answer => {
    rl.close();
    resolve(answer);
  }));
}


function askConfirmation(prompt) {
  return askQuestion(prompt).then((answer) => {
    const ansBool = answer.trim().toLowerCase() === "y" ? true : false
    return ansBool
  })
}




// MAIN FUNCTION
(async () => {

  const dbConnection = await (require('./db')(process.env.HOST, process.env.MONGO_PORT, process.env.MONGO_DB_NAME));
  console.log("\n")


  console.log("db.maintenance.js by @alreylz")

  const operations = [
    {
      keyword: "delall", description: "Remove everything from the database", handler: () => {
        removeAll()
          .then((result) => {
            console.log(result)
          })
          .catch((e) => {
            console.error(e)
            process.exit(1)
          }).finally((_) => {
            process.exit(0)
          })
      }
    },
    {
      keyword: "delroom",
      description: "Delete a room by name (and all linked data)",
      handler: () => {
        return askQuestion('Introduce the name of the room to delete: ')
          .then((roomName) => removeRoomByNameCascade(roomName))
          .then(result => console.log(result))
          .catch((err) => { console.error(err.message); process.exit(1) })
          .finally((_) => process.exit(0))
      }
    },
    {
      keyword: "delAllroomsExcept",
      description: "Deletes all rooms of the database except for the ones listed",
      handler: () => {
        return askQuestion('Introduce the names of the rooms to keep separated by comma (,): ')
          .then((roomNamesCommaSeparated) => removeAllRoomsExceptCascade(roomNamesCommaSeparated.split(",")))
          .then(result => console.log(result))
          .catch((err) => { console.error(err.message); process.exit(1) })
          .finally((_) => process.exit(0))
      }
    },
    {
      keyword: "delsesh",
      description: "Delete a session by id (and all linked data)",
      handler: () => {
        return askQuestion('Introduce the id of the session to delete: ')
          .then((roomName) => removeSessionCascade(roomName))
          .then(result => console.log(result))
          .catch((err) => { console.error(err.message); process.exit(1) })
          .finally((_) => process.exit(0))
      }
    }, {
      keyword: "listuseless",
      description: "Lists suspicious problems about the database",
      handler: () => {

        return askConfirmation("Would you like to be promped to fix problems interactively?")
          .then((yn) => {
            return listUselessData(yn)
          })
          .catch((err) => { console.error(err.message); process.exit(1) })
          .finally((_) => process.exit(0))
      }
    },
    {
      keyword: "remunlinked",
      description: "Removes data for empty rooms as well as the room itself",
      handler: () => {
        removeUnlinkedData().then((result) => console.log(result))
          .catch((err) => { console.error(err); process.exit(1) })
          .finally((_) => process.exit(0))
      }
    },
    { keyword: "exit", description: "Exit the maintenance program", handler: () => process.exit(0) }

  ]

  console.log('What DB maintenance operation do you want to perform?');
  operations.forEach((op) => {
    console.log(`"${op.keyword}" :  ${op.description}`);
  });


  const userOption = await askQuestion('Enter an option: ');
  const chosen = operations.find((opt) => { return opt.keyword === userOption.trim() })
  await chosen.handler()


})()


