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

async function main() {

    // Creating a room from template
    const room_MockTemplate = require('./templates/room.MockTemplate.json')
    delete room_MockTemplate._id
    room_MockTemplate.name = `mockRoom_${uuidv4()}`
    const nuRoom = await postData("/rooms", room_MockTemplate)
    console.log("INSERTED A ROOM", nuRoom)

    // Creating a room measurement from template
    const measurementSessionForRoom_MockTemplate = require(`./templates/measurementSession.MockTemplate.json`)
    delete measurementSessionForRoom_MockTemplate._id
    measurementSessionForRoom_MockTemplate.roomId = nuRoom._id;
    measurementSessionForRoom_MockTemplate.measuremensOwner = "MOCK_ESPACIOSOA"
    measurementSessionForRoom_MockTemplate.measurementDevice = "ANDROID_PHONE"
    measurementSessionForRoom_MockTemplate.timestamp = (new Date()).toISOString();
    const nuMeasurementSession = await postData("/measurementSessions", measurementSessionForRoom_MockTemplate)
    console.log("INSERTED A SESSION", nuMeasurementSession)

    //Creating a measurement (phone template)
    const phoneMeasurementForSessionInRoom_MockTemplate = require("./templates/phoneRoomMeasurement.MockTemplate.json")
    delete phoneMeasurementForSessionInRoom_MockTemplate._id
    phoneMeasurementForSessionInRoom_MockTemplate.timestamp = (new Date()).toISOString();
    phoneMeasurementForSessionInRoom_MockTemplate.roomId = nuRoom._id
    phoneMeasurementForSessionInRoom_MockTemplate.measurementSession = nuMeasurementSession._id
    const nuPhoneMeasurement = await postData("/roomMeasurements", phoneMeasurementForSessionInRoom_MockTemplate)
    console.log("INSERTED A PHONE Measurement", nuPhoneMeasurement)

    // Creating a PI Measurement (phone template)
    const piMeasurementForRoom_MockTemplate = require('./templates/piRoomMeasurement.MockTemplate.json');
    delete piMeasurementForRoom_MockTemplate._id
    piMeasurementForRoom_MockTemplate.timestamp = (new Date()).toISOString();
    piMeasurementForRoom_MockTemplate.roomId = nuRoom._id
    const nuPiMeasurement = await postData("/roomMeasurements", piMeasurementForRoom_MockTemplate)
    console.log("INSERTED A PI Measurement", nuPiMeasurement)

}


// Executing async function in body
(async () => {
    await main();
})();