const {verifyAccessToken, refreshTokenPairFromRefreshToken, setAuthCookies, clearAuthCookies }=require("../Auth") 



// Logging Middleware
const loggerMiddleware = (req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
};


const FIXED_AUTH_TOKEN = "WEDONTUSETOKENSAROUNDHERE"

// Authentication Middleware
const authMiddleware = (req, res, next) => {
    const token = req.headers['authorization'];
    if (token === FIXED_AUTH_TOKEN) {
        console.log("VALID TOKEN")
        next();
    } else {
        res.status(401).send('Unauthorized');
    }
};






function isAuthenticated(req) {

    // console.log(req.cookies)
    if (req.cookies == null)
        return false 

    const hasAccessToken = ("access-token" in req.cookies) 
    const isValidToken = verifyAccessToken(req.cookies["access-token"], "access")
    
    return hasAccessToken && isValidToken
}
function hasValidRefreshToken(req){
    // console.log(req.cookies)
    if (req.cookies == null)
        return false 

    const hasRefreshToken = ("refresh-token" in req.cookies) 
    const isValidToken = verifyAccessToken(req.cookies["refresh-token"], "refresh")
    
    return hasRefreshToken && isValidToken
}


//Client redirection depending on the middleware
//JUST MAKES THE USER GO TO A DIFFERENT PAGE
const loginJWTAuthClientMiddleware = async (req,res,next) =>{
    

    const loginPagePath = "/login"
    const homePagePath = "/"

    console.log(req.path)
    //If no cookie login exists



    ///Go to home page if authenticated
    if(isAuthenticated(res)){
      return req.path != homePagePath ?  res.redirect(homePagePath) : next()
    }

    if(hasValidRefreshToken(req)){
        //Request new token
        const tokenPair = refreshTokenPairFromRefreshToken(req)
        setAuthCookies(res,tokenPair)
        return req.path != homePagePath ?  res.redirect(homePagePath) : next()
    }


    if(!isAuthenticated(req) && !hasValidRefreshToken(req)){
        clearAuthCookies(res)
        if(req.path!=loginPagePath)
            return res.redirect(loginPagePath)
        return next()
    }
   
}

//Unautho
const protectedAPIAuthMiddleWare = (req,res,next) =>{


    let authenticated = false


    if(
        !("access-token" in req.cookies) 
        &&
        !("refresh-token" in req.cookies)
    ) {

        console.log("No HTTP only cookies auth is present")
        //If no login exists
        return res.status(401).response({message:"No HTTP-only cookies present"}) 
    }
    else{

        console.log("Http only cookies for tokens are present. Verifying...")


        console.log("ACCESS TOKEN", req.cookies["access-token"])
        console.log("REFRESH TOKEN", req.cookies["refresh-token"])



        if(verifyAccessToken(req.cookies["access-token"], "access-token"))
            authenticated = true
        else
        next()

    }



    //Authentication check using the authorization HTTP header instead of http only cookies
    if(
        !("Authorization" in req.headers) &&
         !(req.headers["Authorization"].startsWith(`Bearer `))){

            console.log("No Authorization header or valid one present")
            return res.status(401).response({message:"No Authorization header or valid one present"}) 

        }
         else{
            const onHeaderJWTtoken = authHeader && authHeader.split(' ')[1];
            console.log("Authorization header present, found token", onHeaderJWTtoken)

         }


    //Proceed
    next()

   
}

//Handle unknown routes "one level deep", not /v1/API... for example and not / or /login
const shortRootRedirectsMiddleWare = ((req, res, next) => {
  if (/^\/[^\/]+$/.test(req.path) ) {
    if(req.path!= "/")
      return res.redirect('/');
  }
  next();
});





// Export multiple middlewares
module.exports = {
    loggerMiddleware,
    authMiddleware,
    loginJWTAuthClientMiddleware,
    protectedAPIAuthMiddleWare,
    shortRootRedirectsMiddleWare
};
