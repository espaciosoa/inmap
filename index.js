const https = require('https');
const fs = require('fs');
require("dotenv").config()

const readline = require("readline")
const express = require('express');
const cookieParser = require('cookie-parser');
var cors = require('cors')
const pathCerts = "/etc/letsencrypt/live/test.alreylz.me";
const {shortRootRedirectsMiddleWare}= require("./routes/rest/middlewares/Middlewares.md.js")



// Load SSL certificate and private key
const sslOptions = {

  key: fs.readFileSync(pathCerts + '/privkey.pem'),
  cert: fs.readFileSync(pathCerts + '/cert.pem'),
};

const app = express();
app.use(cors())


const ObjectId = require('mongoose').Types.ObjectId;



const dbConnection = require('./db')(process.env.HOST, process.env.MONGO_PORT, process.env.MONGO_DB_NAME);
const { Room, RoomMeasurement, MeasurementSession } = require("./model/allModels")

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// To use cookie parser
app.use(cookieParser());
// Create the HTTPS server
https.createServer(sslOptions, app).listen(process.env.PORT, () => {
  console.log(`HTTPS server is running at https://${process.env.HOST}:${process.env.PORT}`);
  console.log(`MongoDB instance running at https://${process.env.HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB_NAME}`)

  // removeAll()
});



const APIRoot = require("./routes/rest/index.api")
app.use('/v1/API/', APIRoot)


const RoomAPIEndpoints = require("./routes/rest/Rooms.api")
app.use('/v1/API/Rooms', RoomAPIEndpoints)

const MeasurementSessionAPIEndpoints = require("./routes/rest/MeasurementSessions.api")
app.use('/v1/API/MeasurementSessions', MeasurementSessionAPIEndpoints)

const RoomMeasurementsAPIEndpoints = require("./routes/rest/RoomMeasurements.api")
app.use('/v1/API/RoomMeasurements', RoomMeasurementsAPIEndpoints)


//Login & Logout with JWT
const {AuthenticationEndpoints} = require("./routes/rest/Auth")
app.use("/v1/API/",AuthenticationEndpoints)




const SSR = require("./routes/ssr/Client.ssr")
app.use('/', SSR)


app.use(express.static('./'));

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/client'));


app.use(shortRootRedirectsMiddleWare)

//Handler of all the undefined endpoints
app.use((req, res) => {
  res.status(404).send('<h1>404 - Page Not Found</h1><p>The page you are looking for does not exist.</p>');
});






// removeAll()


// removeRoom("3eab0ddf-6d81-496b-a123-5f3c7560bcd3")




// removeRoomByNameCascade("uniTest")

async function removeRoomByNameCascade(name) {
  const room = await Room.findOne({ name: name })
  if (!room) {
    return
  }
  console.log("About to remove room by name ", name)
  await RoomMeasurement.deleteMany({ roomId: room._id })
  await MeasurementSession.deleteMany({ roomId: room._id })
  await Room.deleteOne({ _id: room._id })

}


async function removeRoomCascade(id) {

  await RoomMeasurement.deleteOne({ roomId: id }).exec()
  await MeasurementSession.deleteOne({ roomId: id }).exec()
  await Room.deleteOne({ _id: id }).exec()
}



async function removeSessionCascade(id) {


  //Check if session  is the only one for a room

  const session = MeasurementSession.findOne({ _id: id })
  const roomId = session.roomId  // The room being measured
  //Check if there is only a single session for this room, and thus delete the room
  const isOnlySessionRoom = (_roomId) => MeasurementSession.countDocuments({ roomId: _roomId })
  if (isOnlySessionRoom(roomId))
    await removeRoomCascade(roomId)
  else {
    await MeasurementSession.deleteOne({ _id: id })
  }
}


async function removeAll() {

  await RoomMeasurement.deleteMany({}).exec()
  await MeasurementSession.deleteMany({}).exec()
  await Room.deleteMany({}).exec()

  return

}


(async () => {
   await listUselessData(false)
  // const cleanup = await askQuestion("Delete?") ?? "n"
  // if (cleanup.toLowerCase() === "y") {
  //   await listUselessData(true)
  // }
})()




//MOVE ME 
// Checks for useless and test data in the db that can be deleted
async function listUselessData(performDelete = false) {

  const allRooms = await Room.find({})

  //Explore all rooms and the corresponding measurements
  for (const r of allRooms) {

    if (r.name.length < 2) {
      console.warn(`⚠️ Room ${r.name} with id ${r._id} has a super short name, it's possibly a test`)
      if (performDelete) {
        removeRoomCascade(r._id)
        continue;
      }
    }

    const isSingleRepeatedDigit = (str) => /^([a-zA-Z0-9])\1*$/.test(str)
    if (isSingleRepeatedDigit(r.name)) {
      console.warn(`⚠️ Room ${r.name} with id ${r._id} looks like a test. Consider deleting it`)
      if (performDelete) {
        removeRoomCascade(r._id)
        continue;
      }
    }

    const allSessionsForRoom = await MeasurementSession.find({ roomId: r })

    for (const s of allSessionsForRoom) {

      const measurementsForSession = await RoomMeasurement.countDocuments({ measurementSession: s._id })

      if (measurementsForSession < 20) {
        console.warn(`⚠️ Session ${s._id} (associated to room '${r.name}'  ) has ${measurementsForSession} measurements, which is not a lot. It is possibly a test`)
        if (performDelete) {
          await removeSessionCascade(s._id)
        }
      }
    }


}



  //Should check for unlinked sessions or measurements


}



function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}