const https = require('https');
const fs = require('fs');
require("dotenv").config()
const express = require('express');
const cookieParser = require('cookie-parser');
const pathCerts = "/etc/letsencrypt/live/test.alreylz.me";




// Load SSL certificate and private key
const sslOptions = {

  key: fs.readFileSync(pathCerts + '/privkey.pem'),
  cert: fs.readFileSync(pathCerts + '/cert.pem'),
};

const app = express();



const ObjectId = require('mongoose').Types.ObjectId;



const dbConnection = require('./db')(process.env.HOST, process.env.MONGO_PORT, process.env.MONGO_DB_NAME);
const { Room, RoomMeasurement, MeasurementSession } = require("./model/allModels")



// console.log(Room.schema.paths); 

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
app.use('/v1/API/', APIRoot )


const RoomAPIEndpoints = require("./routes/rest/Rooms.api")
app.use('/v1/API/Rooms', RoomAPIEndpoints)

const MeasurementSessionAPIEndpoints = require("./routes/rest/MeasurementSessions.api")
app.use('/v1/API/MeasurementSessions', MeasurementSessionAPIEndpoints)

const RoomMeasurementsAPIEndpoints = require("./routes/rest/RoomMeasurements.api")
app.use('/v1/API/RoomMeasurements', RoomMeasurementsAPIEndpoints)





const SSR = require("./routes/ssr/Client.ssr")
app.use('/', SSR)

app.use(express.static('./'));

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/client'));

async function testInsert(roomName) {

  console.log("TEST INSERT")
  console.log(Room)

  return Room.create({ name: roomName, propTest1: "Hey", propTest2: "Ho" })
}


async function testInsertMeasurements(json) {

  console.log("TEST INSERT COORDS")

  let nuMeasurement = new RoomMeasurement(json)

  return nuMeasurement.save()
}


// removeAll()


// removeRoom("3eab0ddf-6d81-496b-a123-5f3c7560bcd3")

async function removeRoom(id){



  await RoomMeasurement.deleteOne({roomId:id}).exec()
  await MeasurementSession.deleteOne({roomId:id}).exec()
  await Room.deleteOne({_id:id}).exec()


  
}



async function removeAll() {


  await RoomMeasurement.deleteMany({}).exec()
  await MeasurementSession.deleteMany({}).exec()
  await Room.deleteMany({}).exec()
  
  return 


}




