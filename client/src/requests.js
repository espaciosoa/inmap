// const API_BASE_URL = "https://measurements.espaciosoa.com/v1/API/"
const API_BASE_URL = "https://127.0.0.1:8443/v1/API/"


const AUTH_TOKEN  ="WEDONTUSETOKENSAROUNDHERE"

export async function getMeasurements() {
    const response = await fetch(API_BASE_URL + "roomMeasurements", {
        method: "GET",
    });

    return await response.json();
}



export async function getSessions() {
    const response = await fetch(API_BASE_URL + "measurementSessions", {
        method: "GET",
    });
    return await response.json();
}



// WORKING ON THESE TWO IN THE FRONT
export async function getSessionsForRoom(roomId) {
    const response = await fetch(API_BASE_URL + `measurementSessions/query?roomId=${roomId}`, {
        method: "GET",
    });
    
    const responseContent = await response.json();

    return responseContent;

}

export async function getMeasurementsForSession(sessionId) {
    const response = await fetch(API_BASE_URL + `roomMeasurements/query?measurementSession=${sessionId}`, {
        method: "GET",
    });
    const responseContent = await response.json();    
    return responseContent
}
//----------------------------------------



export async function getRooms() {
    const response = await fetch(API_BASE_URL + "Rooms", {
        method: "GET",
    });

    return await response.json();
}


export async function putSession(session) {

    const sessionCopy = { ...session };
    delete sessionCopy._id;
    const response = await fetch(API_BASE_URL + `measurementSessions/${session._id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionCopy),
    });

    return await response.json();
}



export async function deleteMeasurement(measurementId) {

    const headers = { 'Authorization': AUTH_TOKEN };

    const response = await fetch(API_BASE_URL + "roomMeasurements/" + measurementId, {
        method: "DELETE",
        headers: headers
        
    });
    return await response.json();
}



export async function deleteSession(sessionId) {

    const headers = { 'Authorization': AUTH_TOKEN };
    
    const response = await fetch(API_BASE_URL + "measurementSessions/" + sessionId, {
        method: "DELETE",
        headers: headers
    });
    return await response.json();
}
