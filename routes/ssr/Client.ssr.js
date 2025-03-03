const express = require('express')
const router = express.Router()


// Define routes for all REST methods
router.get('/', async (req, res) => {



  //     const allRooms = await Room.find({}).exec()
  //   const allMeasurements = await RoomMeasurement.find({}).exec()
  //   res.json({rooms:allRooms, measurements: allMeasurements})
  res.sendfile("./client/index.html");
});


router.get('/login', async (req, res) => {

  res.sendfile("./client/login.html");
})




const USER = "alreylz";
const PASS = "0124";


router.post('/login', async (req, res) => {

  const loginData = {username: req.body.username, password: req.body.password}

  if(loginData.username !== USER && loginData.password !== PASS){
    res.statusCode(401).json({ error: "Invalid Credential: Unauthorized" });
  }

  res.cookie('login-cookie', '1', { expires: new Date(Date.now() + 900000), httpOnly: true })

  return res.status(200).redirect("/")

})








module.exports = router