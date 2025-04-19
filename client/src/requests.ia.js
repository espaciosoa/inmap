/**
 * Makes a call to the api that is meant to obtain IA generated maps
 */
export async function requestIAAPI() {
    const response = await fetch("http://localhost:8000/ia/testReturnImage", {
        method: "GET",
    });
    console.log(response)
    console.log(response.body)
    return await response.json();
}
export async function requestIAAPIReal(roomName) {
    const response = await fetch(`http://localhost:8000/ia/inference/${roomName}`, {
        method: "GET",
    });
    console.log(response)
    console.log(response.body)
    return await response.json();
}



