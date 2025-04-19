const express = require('express')


// Read global .env
require("dotenv").config()
const runninEnvironment = process.env.NODE_ENV ? process.env.NODE_ENV : "development"
// Check development environment and if not set, default to development
require('dotenv').config({ path: `.env.${runninEnvironment}`, override: true });


const { loginJWTAuthClientMiddleware } = require("../rest/middlewares/Middlewares.md.js")
const router = express.Router()
const { generateTokens, setAuthCookies } = require("../rest/Auth.js")

// Define routes for all REST methods
router.get('/', [loginJWTAuthClientMiddleware], async (req, res) => {
  res.sendfile("./client/index.html");
});

router.get('/login', [loginJWTAuthClientMiddleware], async (req, res) => {
  return res.render("views/login.ejs", {error: null});
})






const USER = process.env.USERNAME ?? "alreylz";
const PASS = process.env.PASSWORD ?? "0124";


// SSR Login enpdpoint
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  if (username != USER && PASS != password) {

    return res.render("views/login.ejs", {
      error: "Invalid username or password",
    });
  }
  // Create JWT Token
  const tokenPair = generateTokens({ username: username })
  // Send token as HTTP-only cookie (prevents XSS)
  setAuthCookies(res, tokenPair)

  res.status(200).redirect("/")

});


// Logout server-side (Clear cookie) 
router.post("/logout", (req, res) => {
  res.clearCookie("access-token");
  res.clearCookie("refresh-token");
  res.status(200).redirect("/login");
});






module.exports = router