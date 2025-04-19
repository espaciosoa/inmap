//Loads all models defined in the application  and allows access to them as {Room}

const mongoose = require("mongoose");
const fs = require("fs");
const path = require("path");

const models = {};

console.log(__dirname)
// Read all model files dynamically
fs.readdirSync(__dirname)
.filter(file => file.endsWith(".model.js") && file !== "index.js" && file !== "allModels.js")
.forEach(file => {

    const modelName = file.split(".")[0]; // Get model name from filename
    const modelFile = path.join(__dirname, file)
    console.log(`\t✅ DB model File ${modelFile}`)
    const {Schema} = require(modelFile); // Import schema
    
    models[modelName] = mongoose.model(modelName, Schema); // Register model (DAO)
    // console.log(models[modelName].schema.paths)
});

console.log("Loaded the following MONGOOSE Models", mongoose.modelNames())

  
module.exports = models; // Export all models
  

// console.log(module.exports)