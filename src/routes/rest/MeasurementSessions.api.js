const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid');
const { isEmptyObject } = require("../../shared/basic.validation")

const { MeasurementSession } = require("../../model/allModels");
const { authMiddleware } = require('./middlewares/Middlewares.md');

// Define routes for all REST methods
router.get('/', async (req, res) => {
  const allSessions = await MeasurementSession.find({}).exec()
  res.json(allSessions)
});


router.get("/query", async (req, res) => {

  const supportedFieldFilters = ["roomId"];
  const queryFieldsFilterObject = supportedFieldFilters.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(req.query, key)
      && req.query[key] !== undefined) {
      acc[key] = req.query[key];
    }
    return acc;
  }, {});

  const supportedOptions = ["limit", "sort"]
  const queryOptionsFilters = supportedOptions.reduce((acc, key) => {
    if (Object.prototype.hasOwnProperty.call(req.query, key)
      && req.query[key] !== undefined) {
      acc[key] = req.query[key];
    }
    return acc;
  }, {});

  try {

    if (isEmptyObject(queryFieldsFilterObject) && isEmptyObject(queryFieldsFilterObject)) {
      throw new Error("No parameters specified for query endpoint")
    }

    const results = await MeasurementSession.find(
      queryFieldsFilterObject,
      null,
      queryOptionsFilters
    )

    return res.status(200).json(
      {
        success: true,
        // query: queryFieldsFilterObject,
        // options: queryOptionsFilters,
        data: results
      }
    )

  }
  catch (error) {

    res.status(500).json({
      success: false,
      query: queryFieldsFilterObject,
        options: queryOptionsFilters,
      message: `Something went wrong.\n
      Supported Field Filters: ${supportedFieldFilters.reduce((acc, curr, idx, arr) => {
        return acc = acc + ((idx < arr.length && idx > 0) ? "," : "") + curr
      }, '')}
      Supported Options: ${supportedOptions.reduce((acc, curr, idx, arr) => {
        return acc = acc + ((idx < arr.length && idx > 0) ? "," : "") + curr
      }, '')}
      ${error.message}`
    })
  }


});





router.post('/', [authMiddleware], async (req, res) => {
  console.log('POST /MeasurementSessions Body:', req.body);


  const session_IncomingObject = req.body;

  delete session_IncomingObject["remoteSync"]

  const nuSessionId = uuidv4()

  const createdSession = new MeasurementSession({ ...session_IncomingObject, _id: nuSessionId })

  const result = createdSession.save()

  console.log(result)
  res.json(createdSession);

});



router.put("/:id", [authMiddleware], async (req, res) => {

  console.log(`PUT /MeasurementSessions/${req.params.id} Body:`, req.body);

  try {

    const updateSessionOrNull = await MeasurementSession.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).exec()

    if (!updateSessionOrNull) {
      return res.status(404)
        .json({
          success: false,
          message: "Session not found"
        });
    }

    return res.json({
      success: true,
      data: updateSessionOrNull
    });
  }
  catch (error) {
    console.error("Error updating session:", error);
    return res.status(500).json({
      success: false,
      message: "Internal servfer error"
    });
  }
})

router.delete("/", [authMiddleware], async (req, res) => {
  throw new Error("NotImplemented")
})




router.all('*', (req, res) => {
  res.status(405).send(`Method ${req.method} not allowed`);
});

module.exports = router