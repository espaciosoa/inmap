const { v4: uuidv4 } = require('uuid');
const API_BASEPATH = "https://127.0.0.1:8443/v1/API"
require("dotenv").config()

async function postData(subpath, bodyObj) {
    const response = await fetch(
        `${API_BASEPATH}${subpath}`
        , {

            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "WEDONTUSETOKENSAROUNDHERE"
            },
            body: JSON.stringify(
                bodyObj
            )
        });

    const result = await response.json();
    return result
}

async function main(options = {
    numMeasurements: 1000,
    sessionsGeneratorConfig: [
        {
            lat: 40.43419962968242,
            lon: -3.626855970671248,
            comment:"Mock session with coords at workplace"
        },
        // {
        //     lat:40.33222093350904, 
        //     lon:-3.766959080089313,
        //     comment:"Mock session with coords at Uni"

        // }
    ]
}) {

    // Creating a room from template
    const room_MockTemplate = require('./templates/room.MockTemplate.json')
    delete room_MockTemplate._id
    room_MockTemplate.name = `mockRoom_${uuidv4()}`
    const nuRoom = await postData("/rooms", room_MockTemplate)
    console.log("INSERTED A ROOM", nuRoom)

    // Creating a room measurement from template
    const measurementSessionForRoom_MockTemplate = require(`./templates/measurementSession.MockTemplate.json`)
    delete measurementSessionForRoom_MockTemplate._id
    for (const sessionGenConfig of options.sessionsGeneratorConfig) {
        const newMeasurementSessionForRoom_MockTemplate = structuredClone(measurementSessionForRoom_MockTemplate);
        newMeasurementSessionForRoom_MockTemplate.roomId = nuRoom._id;
        newMeasurementSessionForRoom_MockTemplate.measuremensOwner = "MOCK_ESPACIOSOA"
        newMeasurementSessionForRoom_MockTemplate.measurementDevice = "ANDROID_PHONE"
        newMeasurementSessionForRoom_MockTemplate.timestamp = (new Date()).toISOString();
        newMeasurementSessionForRoom_MockTemplate.worldPosition = { lat: sessionGenConfig.lat, lon: sessionGenConfig.lon };
        newMeasurementSessionForRoom_MockTemplate.comment = sessionGenConfig.comment ?? "No comment"
        const nuMeasurementSession = await postData("/measurementSessions", newMeasurementSessionForRoom_MockTemplate)
        console.log("INSERTED A SESSION", nuMeasurementSession)



        //Creating a measurement (phone template)
        const phoneMeasurementForSessionInRoom_MockTemplate = require("./templates/phoneRoomMeasurement.MockTemplate.json")
        delete phoneMeasurementForSessionInRoom_MockTemplate._id


        for (let times = 0; times < options.numMeasurements; times++) {
            const newPhoneMeasurementForSessionInRoom_FromMockTemplate = structuredClone(phoneMeasurementForSessionInRoom_MockTemplate)

            const genRandomPositionInArea = (radiusMeters) => {
                const angle = Math.random() * 2 * Math.PI;
                const radius = Math.sqrt(Math.random()) * radiusMeters;
                const x = radius * Math.cos(angle);
                const z = radius * Math.sin(angle);
                return {
                    x: x,
                    y: phoneMeasurementForSessionInRoom_MockTemplate.position.y,
                    z: z
                }
            }

            //Create N phone mock measurements 
            newPhoneMeasurementForSessionInRoom_FromMockTemplate.position = genRandomPositionInArea(10)
            newPhoneMeasurementForSessionInRoom_FromMockTemplate.timestamp = (new Date()).toISOString();
            newPhoneMeasurementForSessionInRoom_FromMockTemplate.roomId = nuRoom._id
            newPhoneMeasurementForSessionInRoom_FromMockTemplate.measurementSession = nuMeasurementSession._id

            const nuPhoneMeasurement = await postData("/roomMeasurements", newPhoneMeasurementForSessionInRoom_FromMockTemplate)
            console.log("INSERTED A PHONE Measurement ", nuPhoneMeasurement)
        }
        console.log(`DONE Mocking ${options.numMeasurements} ROOM MEASUREMENTS`)

        // Creating a PI Measurement (phone template)
        const piMeasurementForRoom_MockTemplate = require('./templates/piRoomMeasurement.MockTemplate.json');
        delete piMeasurementForRoom_MockTemplate._id
        piMeasurementForRoom_MockTemplate.timestamp = (new Date()).toISOString();
        piMeasurementForRoom_MockTemplate.roomId = nuRoom._id
        const nuPiMeasurement = await postData("/roomMeasurements", piMeasurementForRoom_MockTemplate)
        console.log("INSERTED A PI Measurement", nuPiMeasurement)

    }
}


// Executing async function in body
(async () => {
    await main();
})();