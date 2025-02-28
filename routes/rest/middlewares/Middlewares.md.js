
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


// Export multiple middlewares
module.exports = {
    loggerMiddleware,
    authMiddleware,
};
