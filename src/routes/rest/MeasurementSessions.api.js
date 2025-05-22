const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid');

const { MeasurementSession } = require("../../model/allModels");
const { authMiddleware } = require('./middlewares/Middlewares.md');

// Define routes for all REST methods
router.get('/', async (req, res) => {
  const allSessions = await MeasurementSession.find({}).exec()
  res.json(allSessions)
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