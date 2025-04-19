const {verifyAccessToken, refreshTokenPairFromRefreshToken, setAuthCookies, clearAuthCookies, isAuthenticated,hasValidRefreshToken }=require("../Auth") 



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
const protectedAPIAuthMiddleWare = async (req,res,next) =>{


    let authenticated = false


    // //CHECK AUTH VIA COOKIES
    // if(
    //     !("access-token" in req.cookies) 
    //     &&
    //     !("refresh-token" in req.cookies)
    // ) {

    //     console.log("No HTTP only cookies auth is present")
    //     //If no login exists
    //     return res.status(401).response({message:"No HTTP-only cookies present"}) 
    // }
    // else{

    //     console.log("Http only cookies for tokens are present. Verifying...")


    //     console.log("ACCESS TOKEN", req.cookies["access-token"])
    //     console.log("REFRESH TOKEN", req.cookies["refresh-token"])

    //     if(verifyAccessToken(req.cookies["access-token"], "access-token"))
    //         authenticated = true
    //     else
    //     next()

    // }



    //Authentication check using the authorization HTTP header instead of http only cookies
    if(!("authorization" in req.headers)){

        
            console.log(req.headers)
            console.log("No Authorization header or valid one present")
            return res.status(401).json({message:"No Authorization header or valid one present"}) 

        }
         else{
            
            const authHeader = req.headers.authorization

            if(!authHeader.startsWith(`Bearer `)){
                return res.status(401).json({message:"Auth header has wrong format"}) 
            }
            
        
                console.log(" onHeadertoken",authHeader)

                const onHeaderJWTtoken = authHeader.split(' ')[1];
                console.log("Authorization header present, found token", onHeaderJWTtoken)
                if(await verifyAccessToken(onHeaderJWTtoken, "access") ==null)
                    return res.status(401).json({message:"Invalid token"}) 

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
