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
const { Room } = require("./model/allModels")



// console.log(Room.schema.paths); 

// Middleware to parse JSON bodies
app.use(express.json());
// Middleware to parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));


// Define routes for all REST methods
app.get('/', async (req, res) => {
  const allData = await Room.find({}).exec()

  res.json(allData)
  // res.send('TODO: Show all database records');
});

app.post('/', async (req, res) => {
  console.log('POST Request Body:', req.body);

  //- Parse the request
  //- Check for special thing in the body and remove it, to "reject" request otherwise
  //- Check get info for a room . Check if one with the same name exists and update in case
  // Important to think about how to store data in the collection (all together has the problem of updating that is costly)

  // let id = new ObjectId(req.params.id);
  result = await testInsert("myRoom")
  res.json(result);
});

app.put('/', (req, res) => {
  console.log('PUT Request Body:', req.body);
  res.send('Received a PUT request');
});

app.delete('/', (req, res) => {
  res.send('Received a DELETE request');
});

app.patch('/', (req, res) => {
  console.log('PATCH Request Body:', req.body);
  res.send('Received a PATCH request');
});

// Catch-all route for unsupported methods
app.all('*', (req, res) => {
  res.status(405).send(`Method ${req.method} not allowed`);
});

// Create the HTTPS server
https.createServer(sslOptions, app).listen(process.env.PORT, () => {
  console.log(`HTTPS server is running at https://${process.env.HOST}:${process.env.PORT}`);
  console.log(`MongoDB instance running at https://${process.env.HOST}:${process.env.MONGO_PORT}/${process.env.MONGO_DB_NAME}`)

  removeAll()
});



async function testInsert(roomName) {
  
  console.log("TEST INSERT")
  console.log(Room)



  // const room = new Room({ name: roomName }); // Don't set `_id`
  // const savedRoom = await room.save();

  // console.log("Room saved:", savedRoom);

  return Room.create({name:roomName, crap:"Hey", oye: "whatsapp"})
}



async function removeAll(){

  return Room.deleteMany({}).exec()


}


