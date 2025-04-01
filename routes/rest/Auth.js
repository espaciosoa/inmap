const express = require('express')
const router = express.Router()
const jwt  = require("jsonwebtoken")


const SECRET_ACCESS = "ALREYLZ"
const SECRET_REFRESH = "RALREYLZ"

function generateTokens(user)  {
    return {
    accessToken: jwt.sign({ username: user.username, type:"access" }, SECRET_ACCESS, { expiresIn: '15m' }),
    refreshToken: jwt.sign({ username: user.username, type:"refresh" }, SECRET_REFRESH, { expiresIn: '7d' })

}};

async function verifyAccessToken(token, type){
   
   try{
        const tokenData =  await jwt.verify(token , type==="access" ? SECRET_ACCESS : SECRET_REFRESH);
        console.log("SUCCESSFULLY VERIFIED AND DECODED TOKEN", tokenData)
        return tokenData
    }
    catch(e){
        console.error(`Error verifying an access token ${token} type='${type}' | ${e.message}`)
        return null
    };
}


// Given that there is a valid refresh token the request, regenerates and sets the cookies again
function refreshTokenPairFromRefreshToken(req){
    
        const encodedData = verifyAccessToken(req.cookies["refresh-token"], "refresh")

        return  encodedData ? generateTokens(encodedData) : null
        
}

function setAuthCookies(res, tokenPair){

    // Send token as HTTP-only cookie (prevents XSS)
    res.cookie("access-token", tokenPair.accessToken, 
        { httpOnly: true,
            secure: true,
            sameSite: "Strict" }
    );

    res.cookie("refresh-token", tokenPair.refreshToken, 
        { httpOnly: true,
            secure: true,
            sameSite: "Strict" }
    );

}

function clearAuthCookies(res){
    res.clearCookie("access-token");
    res.clearCookie("refresh-token");
}

  


// Login Endpoint
router.post("/login", async (req, res) => {

    
    const { username, password } = req.body;
    // const user = await User.findOne({ email });

    
    // if (!user || !(await user.comparePassword(password))) {
    //     return res.status(401).json({ error: "Invalid credentials" });
    // }
    const USER = "alreylz";
    const PASS = "0124";

    if(username != USER && PASS !=password){
        return res.status(401).json({message:"Invalid credentials"})
    }
    
    // Create JWT Token
    const tokenPair = generateTokens({username:username})

    // Send token as HTTP-only cookie (prevents XSS)
    setAuthCookies(res,tokenPair)

    res.json({ message: "Login successful" });
});


// Logout (Clear cookie)
router.post("/logout", (req, res) => {
    res.clearCookie("access-token");
    res.clearCookie("refresh-token");
    res.json({ message: "Logged out" });
});


module.exports = {
    AuthenticationEndpoints : router,
    verifyAccessToken,
    generateTokens,
    refreshTokenPairFromRefreshToken,
    setAuthCookies,
    clearAuthCookies
}