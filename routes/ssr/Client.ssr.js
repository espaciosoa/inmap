const express = require('express')
const {loginJWTAuthClientMiddleware }= require("../rest/middlewares/Middlewares.md.js")
const router = express.Router()






// Define routes for all REST methods
router.get('/', [ loginJWTAuthClientMiddleware],  async (req, res) => {

  res.sendfile("./client/index.html");
});


router.get('/login',[loginJWTAuthClientMiddleware], async (req, res) => {

  res.sendfile("./client/login.html");
})




const USER = "alreylz";
const PASS = "0124";


router.post('/login', async (req, res) => {

  const loginData = {username: req.body.username, password: req.body.password}

  if(loginData.username !== USER && loginData.password !== PASS){
    
    res.statusCode(401).json({ error: "Invalid Credential: Unauthorized" });
  }

  // res.cookie('login-cookie', '1', { expires: new Date(Date.now() + 900000), httpOnly: true })

  return res.status(200).redirect("/")

})








module.exports = router