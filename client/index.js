import {
    localToGeo, validateLat, validateLong, isNumber, rotatePointMap,
    getMeasurements, getSessions, getRooms
}
    from "./main.js"

import { getNaturalLanguageDate } from "./converters.js"
import { estimateValueIDW_LatLong } from "./interpolations.js"
import { EventManager } from "./EventManager.js"
import { mockHeatmapData } from "./Mock.js"

import JSUtils from "./Helpers.js"
// import h337 from './heatmap.js/heatmap.js'; // Ensure the path matches
// import HeatmapOverlay from './heatmap.js/leaflet-heatmap/leaflet-heatmap.js';

const allRooms = await getRooms();
console.log("🏠 ROOMS ", allRooms)

const allSessions = await getSessions()
console.log("📱📏 SESSIONS ", allSessions)

const allMeasurements = await getMeasurements();
console.log("📶 MEASUREMENTS ", allMeasurements)








// GLOBAL STATE
const room = allRooms[2]
// TODO: should allow to display from different sessions.
const chosenSession = allSessions.filter(s => s.roomId == room._id)[0]
const sessionMeasurements = allMeasurements.filter(ms => { return ms.measurementSession == chosenSession._id })
// END GLOBAL STATE


//MOVE ME TO A SEPARATE FILE WHEN THINGS WORK
class PageState extends EventManager {

    constructor(name = "") {
        super();

        this._activeRoom = null;
        this._activeSessions = [];
        this._activeMeasurements = [];


        this.subscribe("onChangeState", (state) => console.log("@state", state))
    }


    #overallStateChange() {
        this._dispatch("onChangeState", this)
    }

    get activeRoom() { return this._activeRoom }
    set activeRoom(room) {
        this._activeRoom = room;
        this._dispatch("onActiveRoomChanged", this._activeRoom);


        this.#overallStateChange()
    }



    addSession(session) {
        this._activeSessions.push(session)
        this._dispatch("onActiveSessionsChanged", this._activeSessions)
        this.#overallStateChange()

    }
    removeSession(session) {
        this._activeSessions.pop(session)
        this._dispatch("onActiveSessionsChanged", this._activeSessions)
        this.#overallStateChange()

    }


    get activeSessions() { return this._activeSessions }

    set activeSessions(sessions) {
        this._activeSessions = sessions
        this._dispatch("onActiveSessionsChanged", this._activeSessions)
        this.#overallStateChange()
    }

    get activeMeasurements() { return this._activeMeasurements }
    set activeMeasurements(measurements) {
        this._activeMeasurements = measurements;
        this._dispatch("onMeasurementsChanged", this._activeMeasurements);
        this.#overallStateChange()

    }


}


// trying to encapsulate global state in a class
const myState = new PageState("visualization_state")

console.log("My state")
console.log(myState)



myState.subscribe("onChangeState", (state) => {

})

//TESTING OF THE MY STATE
myState.subscribe("onActiveSessionsChanged", (activeSessions) => {
    console.log("ACTIVE SESSIONS CHANGED", activeSessions)
})

myState.subscribe("onActiveRoomChanged", (activeRoom) => {
    console.log("ACTIVE ROOM CHANGED", activeRoom)
})

myState.subscribe("onMeasurementsChanged", (activeMeasurements) => {

    console.log("ACTIVE MEASUREMENTS CHANGED", activeRoom)
})








const sessionsCheckboxContainer = document.querySelector("[data-dynamic=sessions]")
const roomOptionsSelect = document.querySelector("[data-dynamic=roomsSelect]")







//For a given array of sessions, shows them as checkboxes
function showSessionsAsCheckboxes(parent, dataArray) {

    const option_HTML_Template = `<li class="session-item">
            <label>
                <span class="session-name">{{sessionId}}</span> |
                <span class="session-date">{{sessionDate}}</span>
            </label>
            <input type="checkbox" data-type="session" data-id="{{sessionId}}" />
        </li>`



    const allSessionCheckboxes = []


    dataArray.forEach(data => {
        const myCheckboxes = JSUtils.replaceTemplatePlaceholders(option_HTML_Template,
            {
                sessionDate: data.timestamp,
                sessionId: data._id,
            });


        const checkboxDOM_Node = JSUtils.txtToHTMLNode(myCheckboxes)
        //TODO: Event subscription pending here
        console.log("Adding onChange events to checkboxes")
        checkboxDOM_Node.addEventListener("change", (ev) => {
            const checkbox = ev.target
            const isActive = checkbox.checked
            console.log(checkbox.dataset)
            const toActivateThing = checkbox.dataset.type
            const toActivateId = checkbox.dataset.id
            // myState.setActiveSessions()
            console.log(`${checkbox} ${toActivateThing} CHANGED isActive ? ${isActive} | id: ${toActivateId}  `)


            isActive ?
                myState.addSession(allSessions.filter(e => e._id === toActivateId)[0])
                : myState.removeSession(allSessions.filter(e => e._id === toActivateId)[0])

        })

        allSessionCheckboxes.push(checkboxDOM_Node)
    })




    parent.replaceChildren(...allSessionCheckboxes)
}


//Given the rooms endpoint, shows all the possible rooms as select options
function showRoomsAsSelectOptions(selectItem, rooms) {

    const roomOptionHtmlTemplate = `<option 
        data-type="room"    
        value={{roomId}}
        data-id={{roomId}}>
            {{roomName}}
        </option>`


    const allRoomsAsOptions = []

    rooms.forEach(r => {

        const myOptionFilledTemplate = JSUtils.replaceTemplatePlaceholders(roomOptionHtmlTemplate,
            {
                roomId: r._id,
                roomName: r.name
            });

        const optionNode = JSUtils.txtToHTMLNode(myOptionFilledTemplate)
        // TODO Event subscription:

        selectItem.addEventListener("change", (ev) => {
            // console.log("ROOM OPTION CHANGE")
            const roomIdSelected = event.target.value
            myState.activeRoom = allRooms.filter(r => r._id == roomIdSelected)[0]
        })

        allRoomsAsOptions.push(optionNode)

    })


    selectItem.replaceChildren(...allRoomsAsOptions)

}


showRoomsAsSelectOptions(roomOptionsSelect, allRooms)



// Make UI react to changes 
myState.subscribe("onActiveRoomChanged", (activeRoom) => {

    showSessionsAsCheckboxes(sessionsCheckboxContainer, allSessions.filter(s => s.roomId == activeRoom._id))

})

myState.subscribe("onChangeState", (state) => {
    showStateInformationSection(state)
})



function showStateInformationSection(state) {

    //Showing in the page for which session I am showing info
    const myDivTemplate = `<section class="currently-displaying"> 
        <header>
            <h2> Room: 
                <span class="room-name">{{roomName}}</span>
                <span class="room-id">{{roomId}}</span>
            </h2>
            <h3 > Session/s: </h3>
                <div class="sessions-displayed-list"> 
                    <!-- Dynamic filling (list of sessions being displayed)-->
                <div class="sessions-displayed-list"> 
        </header> 
         <p> total measurements: {{measurements}} </p>  

      </section>`


    const sessionSpanTemplate = ` <span class="session-name">{{session}}</span> `

    const allSessionSpansNodes = []
    state.activeSessions.forEach(s => {
        const sessionSpanTemplateFilled = JSUtils.replaceTemplatePlaceholders(sessionSpanTemplate, {
            session: s._id
        })

        allSessionSpansNodes.push(JSUtils.txtToHTMLNode(sessionSpanTemplateFilled))
    })



    const myStateSummary = JSUtils.replaceTemplatePlaceholders(myDivTemplate, {
        roomName: `${state.activeRoom.name}`,
        roomId: `${state.activeRoom._id}`,
        measurements: sessionMeasurements.length
    })




    const measurementsContainer = document.querySelector("#measurements")

    const myStateSummaryAlmostFilled = JSUtils.txtToHTMLNode(myStateSummary)
    const sessionsContainer = myStateSummaryAlmostFilled.querySelector(".sessions-displayed-list")

    sessionsContainer.replaceChildren(...allSessionSpansNodes)
    measurementsContainer.replaceChildren(myStateSummaryAlmostFilled)

}


function matchColorLevel(level) {

    let color = "#FFFFFF"
    switch (level) {
        case 0: color = "#FF8282"
            break;
        case 1: color = "#FFC482"
            break;
        case 2: color = "#F0FF82"
            break;
        case 3: color = "#82FF8A"
            break;
        case 4: color = "#82CBFF"
            break;
    }
    return color

}


let origin = {
    lat: chosenSession.worldPosition.lat,
    lon: chosenSession.worldPosition.lon
}

console.log(origin)
// console.warn("@alreylz - USING ANONYMIZED ORIGIN")
// origin = { lat: 40.41523, lon: -3.70711 }






// Init map
const map = L.map('map').setView([origin.lat, origin.lon], 20);
const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 22,
    attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
}).addTo(map);

let layers = []


console.log("MAP OBJECT", map)




const inputLat = document.querySelector("input[name=latitude]")
inputLat.value = origin.lat
const inputLong = document.querySelector("input[name=longitude]")
inputLong.value = origin.lon

const inputRot = document.querySelector("input[name=rotation]")

const form = document.querySelector(".viz-controls-form")



//Gestión de rotar y ajustar origen
form.addEventListener("submit", (ev) => {
    console.log("Onsubmit ")

    ev.preventDefault()
    origin = {
        lat: validateLat(parseFloat(inputLat.value)),
        lon: validateLong(parseFloat(inputLong.value))
    }

    console.log("validated origin", origin)

    clearMapLayers()


    const angleConversion = parseFloat(inputRot.value)
    const angle = Number.isNaN(angleConversion) ? 0 : angleConversion;


    console.log("angle", angle)


    //TODO: Get shape of what I need every time
    let points = myState.activeMeasurements.map(measurement => { return { ...measurement.position, ...measurement.signalMeasurement } })

    renderMap(origin, points, angle)


})


let points = sessionMeasurements.map(measurement => {
    return {
        _id: measurement._id,
        ...measurement.position,
        ...measurement.fullCellSignalStrength,
        ...measurement.fullCellIdentity,
        timestamp: measurement.timestamp,
    }
})

// reference of map events : https://leafletjs.com/reference.html#map-click        
map.on("dblclick", (e) => {


    console.groupCollapsed("Point Estimation Tests : on Map DBL click (📍❓)")

    console.log("Data for click event", e)

    const toEstimatePoint = {
        lat: e.latlng.lat,
        lon: e.latlng.lng
    }
    console.log("📍 toEstimatePoint ", toEstimatePoint)

    const knownDataPoints = points.map(p => {
        // console.log("p", p)
        return { ...p.position, value: p.dbm, ...localToGeo(p.x, p.y, origin.lat, origin.lon) }
    })

    console.log("📍📍📍 KnownDataPoints ", knownDataPoints)
    const estimated = estimateValueIDW_LatLong(toEstimatePoint, knownDataPoints, 10);

    console.log(`🆒 ESTIMATED DBM for unknown point at (${toEstimatePoint.lat}, ${toEstimatePoint.lon}) = ${estimated}`)

    console.groupEnd()
})



myState.subscribe("onMeasurementsChanged", (activeMeasurements) => {

    console.log("ACTIVE MEASUREMENTS CHANGED", activeMeasurements)
    let points = activeMeasurements.map(measurement => { return { ...measurement.position, ...measurement.signalMeasurement, } })

    renderMap(origin, points)
})

renderMap(origin, points)












function clearMapLayers() {
    layers.forEach((l) => {
        map.removeLayer(l)
    })
}





/**
 * origin : lat, lon object
 * points: array of points with the data to paint
 * */
function renderMap(origin, points, rotation = 0, whatToDisplay) {


    whatToDisplay = whatToDisplay || 'level'


    console.log("Rendering map 🗺️", origin)
    map.setView([origin.lat, origin.lon])

    const layerGroupOrigin = L.layerGroup().addTo(map);

    let myOriginPainted = L.marker(origin, {
        color: 'orange',
        fillOpacity: 0.5,
        radius: 0.5
    }).bindPopup("This is the origin").addTo(layerGroupOrigin);
    //add to list of layered info, so that re-rendering on change origin can move printed 
    layers.push(layerGroupOrigin)


    const layerGroupOther = L.layerGroup().addTo(map);
    //Print  saved from phone into database
    points.forEach(c => {
        const localRoomCoordsAsLatLong = localToGeo(c.x, c.z, origin.lat, origin.lon)
        const latLongCoords = rotation === undefined ?
            localRoomCoordsAsLatLong : rotatePointMap(localRoomCoordsAsLatLong.lat, localRoomCoordsAsLatLong.lon, origin.lat, origin.lon, rotation)


        const popupDataForItem = `<div class="tooltip-point-detail">  
                <header > 
                    <h4>Data point detail :</h4>
                </header>
                <div class="two-cols center"> 
                    <div class="signal-data"> 
                            <span> <span class="bold">dbm</span>: {{dbm}} </span>
                            <span> <span class="bold">asuLevel</span>: {{asuLevel}} </span>
                            <span> <span class="bold">qualityLevel</span>: {{level}}</span>
                            <span> <span class="bold">signalType</span>: {{type}} </span>
                            <!-- Now the optionals -->    
                            <span> {{restSignalData}}</span>
                    </div>
                    <div class="cell-identity">
                        <span> <span class="bold">Operator</span>: {{operator}} </span>
                        <span> <span class="bold">Bandwidth</span>: {{bandwidth}} </span>
                    </div> 
                </div>
                <footer>
                    <span class="timestamp-detail"> ⌚ {{timestamp}} </span>
                </footer>
                </div>`

        const popupDataForItemReplaced = JSUtils.replaceTemplatePlaceholders(popupDataForItem,
            {
                timestamp: getNaturalLanguageDate(c.timestamp),
                dbm: c.dbm,
                asuLevel: c.asuLevel,
                level: c.level,
                type: c.type,
                // restSignalData : `cqi:${c.cqi}, rsrp:${c.rsrp}, rssi:${c.rssi}`,
                operator: c.operatorAlphaLong,
                bandwidth: c.bandwidth

            })



        let circle = L.circle(latLongCoords, {
            color: matchColorLevel(c.level || c.qualityLevel),
            fillOpacity: 0.5,
            radius: 0.05
        }).bindPopup(popupDataForItemReplaced).addTo(layerGroupOther);
    })
    //add to list of layered info, so that re-rendering on change origin can move printed 
    layers.push(layerGroupOther)



    // var layerControl = L.control.layers(layerGroupOther).addTo(map);

    console.log("POINTS", points)


    //Heatmap things

    const heatmapData = points.map(c => {
        return {
            ...localToGeo(c.x, c.z, origin.lat, origin.lon),
            value: c.dbm
        }
    }
    )

    const testHMPoints = {
        max: mockHeatmapData.reduce((max, obj) => obj.value > max ? obj.value : max, -Infinity),
        min: mockHeatmapData.reduce((min, obj) => obj.value < min ? obj.value : min, Infinity),
        data: mockHeatmapData //CHANGEME

    };

    console.log("HEATMAP-POINTS", testHMPoints)
    const heatmapConfig = {
        radius: 2,
        maxOpacity: 1,
        gradient: {
            // enter n keys between 0 and 1 here
            // for gradient color customization
            '0': 'orange',
            '0.99': 'blue'
        },
        // scaleRadius: true,
        useLocalExtrema: true,
        latField: "lat",
        lngField: "lon",
        valueField: "value"
    };

    const heatmapLayer = new HeatmapOverlay(heatmapConfig);


    console.log(heatmapLayer)


    //Heatmap layer should be showing
    heatmapLayer.setData(testHMPoints)
    heatmapLayer.addTo(map)

    function metersToPixels(meters, lat) {
        const zoom = map.getZoom();
        return meters / (156543.03392 * Math.cos((lat * Math.PI) / 180) / Math.pow(2, zoom));
    }
    // Update radius dynamically on zoom
    map.on("zoomend", function () {
        const center = map.getCenter();
        const pixelRadius = metersToPixels(1, center.lat); // Example: 500 meters
        heatmapLayer.cfg.radius = pixelRadius;
        heatmapLayer._heatmap.configure({ radius: pixelRadius });
    });
    console.log(map.layers)
}