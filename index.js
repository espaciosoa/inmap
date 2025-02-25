const https = require('https');
const fs = require('fs');
require("dotenv").config()
const express = require('express');
const pathCerts = "/etc/letsencrypt/live/test.alreylz.me";




// Load SSL certificate and private key
const sslOptions = {

  key: fs.readFileSync(pathCerts + '/privkey.pem'),
  cert: fs.readFileSync(pathCerts + '/cert.pem'),
};

const app = express();



const ObjectId = require('mongoose').Types.ObjectId;



const dbConnection = require('./db')(process.env.HOST, process.env.MONGO_PORT, process.env.MONGO_DB_NAME);
const { Room, RoomMeasurement } = require("./model/allModels")



// console.log(Room.schema.paths); 

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));


// Create the HTTPS server
https.createServer(sslOptions, app).listen(process.env.PORT, () => {
  console.log(`HTTPS server is running at https://${process.env.HOST}:${process.env.PORT}`);
  console.log(`MongoDB instance running at https://${process.env.HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB_NAME}`)

  // removeAll()
});



const REST_API = require("./routes/rest/Rooms.api")
app.use('/v1/API', REST_API)

const SSR = require("./routes/ssr/Client.ssr")
app.use('/', SSR)

app.use(express.static('./'));

app.use(express.static(__dirname + '/public'));
app.use(express.static(__dirname + '/client'));

async function testInsert(roomName) {
  
  console.log("TEST INSERT")
  console.log(Room)

  return Room.create({name:roomName, propTest1:"Hey", propTest2: "Ho"})
}


async function testInsertMeasurements(json) {
  
  console.log("TEST INSERT COORDS")
  
  let nuMeasurement = new RoomMeasurement(json)

  return nuMeasurement.save()
}




async function removeAll(){

  RoomMeasurement.deleteMany({}).exec()

  return Room.deleteMany({}).exec()


}




