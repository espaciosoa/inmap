const https = require('https');
const fs = require('fs');

const readline = require("readline")
const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors')
const path = require('path');


// Read global .env
require("dotenv").config()
const runninEnvironment = process.env.NODE_ENV ? process.env.NODE_ENV : "development"
// Check development environment and if not set, default to development
require('dotenv').config({ path: `.env.${runninEnvironment}`, override: true });

// console.log(`RUNNING IN '${process.env.NODE_ENV}' environment mode`)

const interestingENVVars = Object.fromEntries(Object.entries(process.env).filter((keyValPair) => {

  //Filtering only the ones I want to ehck the value for
  const key = keyValPair[0]
  const val = keyValPair[1]

  return [
    "NODE_ENV",
    "HOST",
    "PORT",
    "MONGO_PORT",
    "PATH_CERTS",
    "USERNAME",
    "PASSWORD"].includes(key)

}))


console.log(`🗿 Loaded Environment vars :\n'${runninEnvironment}' mode`, interestingENVVars)


//Where to take the ssl encription certs and private key from
const pathCerts = process.env.PATH_CERTS  //"/etc/letsencrypt/live/test.alreylz.me";
const { shortRootRedirectsMiddleWare } = require("./src/routes/rest/middlewares/Middlewares.md.js")




// Load SSL certificate and private key
const sslOptions = {

  key: fs.readFileSync(pathCerts + '/privkey.pem'),
  cert: fs.readFileSync(pathCerts + '/cert.pem'),
};

const app = express();
//  @todo
// Should further configure for production 
app.use(cors({
  origin: "*"
}))


const dbConnection = require('./db')(process.env.HOST, process.env.MONGO_PORT, process.env.MONGO_DB_NAME);
const { Room, RoomMeasurement, MeasurementSession } = require("./src/model/allModels.js")

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));
// To use cookie parser
app.use(cookieParser());
// Create the HTTPS server
https.createServer(sslOptions, app).listen(process.env.PORT, () => {
  console.log(`--------------------------------------------------------------------------`)
  console.log(`🌐 HTTPS server is running at https://${process.env.HOST}:${process.env.PORT}`);
  console.log(`💾 MongoDB instance running at https://${process.env.HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB_NAME}\n --------------------------------------------------------------------------`)
});



const APIRoot = require("./src/routes/rest/index.api")
app.use('/v1/API/', APIRoot)


const RoomAPIEndpoints = require("./src/routes/rest/Rooms.api")
app.use('/v1/API/Rooms', RoomAPIEndpoints)

const MeasurementSessionAPIEndpoints = require("./src/routes/rest/MeasurementSessions.api")
app.use('/v1/API/MeasurementSessions', MeasurementSessionAPIEndpoints)

const RoomMeasurementsAPIEndpoints = require("./src/routes/rest/RoomMeasurements.api")
app.use('/v1/API/RoomMeasurements', RoomMeasurementsAPIEndpoints)


// Login & Logout with JWT
const { AuthenticationEndpoints } = require("./src/routes/rest/Auth")
app.use("/v1/API/", AuthenticationEndpoints)



// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'client/'));
const SSR = require("./src/routes/ssr/Client.ssr")
app.use('/', SSR)


app.use(express.static('./'));

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/client'));


app.use(shortRootRedirectsMiddleWare)

//Handler of all the undefined endpoints
app.use((req, res) => {
  res.status(404).send('<h1>404 - Page Not Found</h1><p>The page you are looking for does not exist.</p>');
});



setInterval(() => {
  raspberryPiMeasurementsProcessing()
}, 10000)







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





/**
 * Implements the functionality of reassigning pi measurements to their closest session in time
 */
async function raspberryPiMeasurementsProcessing() {

  //Read all unassigned sesssions
  const unasignedPiMeasurements = await RoomMeasurement.find(
    {
      measurementDevice: "RaspberryPi4B",
      measurementSession: "UNASSIGNED"
    })


  // console.log(unasignedPiMeasurements)
  console.log(`FOUND ${unasignedPiMeasurements.length} unassigned Pi measurements`)
  for (const piMeasurement of unasignedPiMeasurements) {



    //get room 
    const associatedRoom = await Room.findOne({ _id: piMeasurement.roomId })

    console.log("Processing unassigned pi measurement", {
      _id: piMeasurement._id, timestamp: piMeasurement.timestamp,
      roomId:piMeasurement.roomId,
      room: associatedRoom.name
    })


    console.log(`this measurement id for room ${associatedRoom.name}`)

    // console.log(piMeasurement.timestamp || "found bad timestamp")
    const referenceTimestamp = new Date(piMeasurement.timestamp);
    console.log("REFERENCE TIMESTAMP", referenceTimestamp)
    const twoHours = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    const lowerBound = new Date(referenceTimestamp.getTime() - twoHours);
    const upperBound = new Date(referenceTimestamp.getTime() + twoHours);


    console.log(`FINDING date for in range \n${lowerBound} \nand \n${upperBound}`)


    //FILTER BY DATE 
    const possibleAssignableSessionsResult = await MeasurementSession.aggregate([
      {
        $match: {
          roomId: piMeasurement.roomId
        }
      },
      //Transform string date to actual date in a new field generated on the fly
      {
        $addFields: {
          timestampDate: { $toDate: "$timestamp" }
        }
      },

      {
        $addFields: {
          timeDiffMilis: {
            $abs: {
              $subtract: ["$timestampDate", referenceTimestamp]
            }
          }
        }
      },
      // Check date in bounds
      {
        $match: {
          timestampDate: { $gte: lowerBound, $lt: upperBound }
        }
      },
      //Order by lowest absolute difference in time
      {
        $sort: {
          timeDiffMilis: 1 // -1 = descending, 1 = ascending
        }
      }
    ])

    console.log(`CANDIDATES FOUND ${possibleAssignableSessionsResult.length}`)
    console.log("------------------------------")
    console.log(possibleAssignableSessionsResult)
    console.log("------------------------------")

    //ASSIGNMENT OR SKIPPING
    if (possibleAssignableSessionsResult.length < 1) {
      console.log("NO CANDIDATES FOUND FOR THIS PI MEASUREMENT")
      //probably should delete the unassigned 
      await RoomMeasurement.deleteOne({_id:piMeasurement._id})
      continue
    }
    // Assign to closest session in time
    const result = await RoomMeasurement.findOneAndUpdate(
      { _id: piMeasurement._id },
      { $set: { measurementSession: possibleAssignableSessionsResult[0]._id } }, // update
      { new: true }
    );
    console.log(`ASSIGNED PI MEASUREMENT ${piMeasurement._id} TO SESSION ${possibleAssignableSessionsResult[0]._id} `)
    console.log(result)


  }

}