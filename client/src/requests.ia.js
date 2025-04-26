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

export async function requestIATraining(roomName) {
    const response = await fetch(`http://localhost:8000/ia/runTraining/${roomName}`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            signalParameter: "dbm",
            epochs: 10,
        }),
    });
    console.log(response)
    console.log(response.body)
    const responseContent = await response.json();


    return responseContent.data

}


export async function requestTrainingJobStatus(jobId) {
    const response = await fetch(`http://localhost:8000/ia/jobStatus/${jobId}`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
        }
    });
    console.log(response)
    console.log(response.body)
    const responseContent = await response.json();


    return responseContent.data

}




export async function requestIAAPIReal(roomName) {
    const response = await fetch(`http://localhost:8000/ia/inference/${roomName}`, {
        method: "GET",
    });
    console.log(response)
    console.log(response.body)
    return await response.json();
}



