
// const API_BASE_URL = "https://test.alreylz.me/v1/API/"
const API_BASE_URL = "https://127.0.0.1:8443/v1/API/"




export async function getMeasurements() {
    const response = await fetch(API_BASE_URL + "RoomMeasurements", {
        method: "GET",
    });

    return await response.json();
}


export async function getSessions() {
    const response = await fetch(API_BASE_URL + "MeasurementSessions", {
        method: "GET",
    });

    return await response.json();
}

export async function getRooms() {
    const response = await fetch(API_BASE_URL + "Rooms", {
        method: "GET",
    });

    return await response.json();
}


export async function putSession(session) {
    
    const sessionCopy = { ...session };
    delete sessionCopy._id;
    const response = await fetch(API_BASE_URL + `MeasurementSessions/${session._id}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionCopy),
    });

    return await response.json();
}


export async function deleteSession(sessionId) {
    const response = await fetch(API_BASE_URL + "MeasurementSessions/" + sessionId, {
        method: "DELETE",
    });
    return await response.json();
}
