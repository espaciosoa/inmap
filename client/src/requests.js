
const API_BASE_URL = "https://test.alreylz.me/v1/API/"
// const API_BASE_URL = "https://localhost:8442/v1/API/"









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
