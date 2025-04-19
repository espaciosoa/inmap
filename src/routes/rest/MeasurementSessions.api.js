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


router.all('*', (req, res) => {
  res.status(405).send(`Method ${req.method} not allowed`);
});

module.exports = router