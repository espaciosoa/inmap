// Main file for the client side
import {
    localToGeo, validateLat, validateLong, isNumber, rotatePointMap,
    getAverageLatLng
}
    from "./src/geo.utils.js"

import {
    getRooms, getSessions,
    getMeasurements,
    getSessionsForRoom,
    getMeasurementsForSession

} from "./src/requests.js"

import { estimateValueIDW_LatLong, generatePointsInRadius, getLatLongBoundingBox } from "./src/interpolations.js"
import JSUtils from "./src/Helpers.js"
import {
    showRoomsAsSelectOptions, showSessionsAsCheckboxes, showNumericPropertiesAsSelect,
    showMeasurementsAsTable, showRoomAsTable, showSessionsAsTables,
    showStateInformationSection

} from "./src/DynamicHtml.js"

import { mapAllowInteraction } from "./src/map.interaction.control.js"
import { initPopup } from "./src/popup.js"

import { getPropertyUnit, getFilterablePropertiesList, getNormalizedValueInRange, getPropertyColorForValue } from "./dist/crap.js"
import { PageState } from "./dist/PageState.js"
import { initLeafletMapWithProviders } from "./src/leaflet.map.utils.js"
import { renderMap } from "./src/visualization.render.js"
const [showPopup, hidePopup] = initPopup()

showPopup("Loading data from API", "load")

console.groupCollapsed("API Rest Data first load of Rooms: 📱📏📶📱📏📶📱📏📶")
showPopup("Loading rooms", "load")
const allRooms = await getRooms();
hidePopup()

console.log("🏠 ROOMS ", allRooms);
console.groupEnd()






// Encapsulating State of the page in an object
let myState = null

try {

    const DEFAULT_ROOM_IDX = allRooms.length - 1



    const sessionsForDefaultRoom = (await getSessionsForRoom(allRooms[DEFAULT_ROOM_IDX]._id)).data
    console.log("📱📏 SESSIONS ", sessionsForDefaultRoom)

    myState = new PageState(
        "visualization_state",
    /*default room */ allRooms[DEFAULT_ROOM_IDX],
        /*default sessions */
        sessionsForDefaultRoom,
        /* visualizing property */ "dbm"
    )

}
catch (error) {
    console.error("Error initing the state")
}

// SUPER IMPORTANT
// FETCHING  FUNCTIONS
const fetchMeasurementsIntoState = async () => {
    showPopup("Loading measurements...", "load")
    const activeSessionIds = myState.activeSessions.map(s => s._id)
    const measurementArrays = await Promise.all(
        activeSessionIds.map(sessionId =>
            getMeasurementsForSession(sessionId).then(res => res.data)
        )
    );
    myState.activeMeasurements = measurementArrays.flat()
    hidePopup()
}

const fetchSessionsIntoState = async () => {
    showPopup("Loading sessions...", "load")
    const associatedSessionsFromEndpoint = (await getSessionsForRoom(myState.activeRoom._id)).data
    myState.activeSessions = associatedSessionsFromEndpoint
    hidePopup()

}
//----------------


// HTML Container of session checkboxes (that modify state)
const sessionsCheckboxContainer = document.querySelector("[data-dynamic=sessions]")
// HTMLSelect item to display room options (changing it modifies state)
const roomOptionsSelect = document.querySelector("[data-dynamic=roomsSelect]")
// Divs to show interactive tables
const SESSIONS_DIV = document.querySelector(".tables.sessions")
const MEASUREMENTS_DIV = document.querySelector(".tables.measurements")
const ROOM_DIV = document.querySelector(".tables.room")

// Init UI with the Initial State
if (myState !== null) {

    showRoomsAsSelectOptions(roomOptionsSelect, myState, allRooms, myState.activeRoom)
    showSessionsAsCheckboxes(sessionsCheckboxContainer, myState,
        myState.activeSessions.map(s => s), myState.activeSessions)
    showStateInformationSection(myState)

    await fetchMeasurementsIntoState();

    // Show tables at the bottom
    showRoomAsTable(ROOM_DIV,
        myState.activeRoom
    )
    showSessionsAsTables(SESSIONS_DIV,
        myState.activeSessions,
        fetchSessionsIntoState
    )
    showMeasurementsAsTable(MEASUREMENTS_DIV,
        myState.activeMeasurements,
        fetchMeasurementsIntoState
    )
};

const map = initLeafletMapWithProviders()


// Make UI react to changes on selected room
myState.subscribe("onActiveRoomChanged", async (activeRoom) => {
    showPopup(`Loading Measurement sessions ${activeRoom.name}`, "load")

    await fetchSessionsIntoState()

    showSessionsAsCheckboxes(sessionsCheckboxContainer,
        myState,
        myState.activeSessions,
        myState.activeSessions)

    showRoomAsTable(ROOM_DIV,
        myState.activeRoom,
    )
    hidePopup()
})
myState.subscribe("onActiveSessionsChanged", async (activeSessions) => {
    await fetchMeasurementsIntoState()
    showSessionsAsTables(SESSIONS_DIV,
        myState.activeSessions,
        fetchSessionsIntoState
    )
})

myState.subscribe("onChangeState", (state) => {
    showStateInformationSection(state)
    console.groupCollapsed("STATE CHANGED: 📱📏📶📱📏📶📱📏📶")
    console.log("📱📏 LOADED SESSIONS ", state.activeSessions)
    console.log("📶 MEASUREMENTS ", state.activeMeasurements)
    console.groupEnd()

    renderMap(map, visualizationCenter, state.activeSessions, state.activeMeasurements)
})

let visualizationCenter = {
    lat: myState.activeSessions[0].worldPosition.lat,
    lon: myState.activeSessions[0].worldPosition.lon
}



map.setView([visualizationCenter.lat, visualizationCenter.lon], 19);

map.doubleClickZoom.disable();




map.on('zoomend', () => {
    const currentZoom = map.getZoom(); // Get current zoom level
    console.log('Current zoom level:', currentZoom);
    //Zoom 21 is the perfect
});


const toMapPointsMapper = (measurement) => {

    //We want to treat differently the measurements made with the raspberry
    if ("measurementDevice" in measurement
        && measurement.measurementDevice === "RaspberryPi4B"
    )
        return {
            _id: measurement._id,
            ...measurement.position,
            timestamp: measurement.timestamp,
            sessionId: measurement.measurementSession,
            measurementDevice: measurement.measurementDevice
        }


    return {
        _id: measurement._id,
        ...measurement.position,
        ...measurement.fullCellSignalStrength,
        ...measurement.fullCellIdentity,
        timestamp: measurement.timestamp,
        sessionId: measurement.measurementSession,
        measurementDevice: measurement.measurementDevice || "ANDROID_PHONE"
    }
}

if (
    allRooms.length >= 1 &&
    myState.activeRoom &&
    myState.activeSessions &&
    myState.activeSessions.length > 0 &&
    myState.activeMeasurements &&
    myState.activeMeasurements.length > 0
) {
    renderMap(
        map,
        visualizationCenter,
        myState.activeSessions,
        myState.activeMeasurements,
        0,
        myState.visualizingProperty
    )
    //This needs to be called when the map is initialized with data
    showNumericPropertiesAsSelect(
        getFilterablePropertiesList(myState._activeMeasurements[0].fullCellSignalStrength?.type),
        myState.visualizingProperty, (value) => {
            myState.visualizingProperty = value

        }
    )
}
else {
    showPopup("ERROR LOADING FROM BACKEND", "error")
}



function toggleDivOverlay(active, divToOverlay, message) {

    const exitingOverlay = divToOverlay.querySelector(".div-overlay")
    if (exitingOverlay) exitingOverlay.remove();

    if (!active) {
        return
    }

    const mapOverlay_HTMLTemplate = `
        <div class="div-overlay map-disabled-overlay">
            <h2>{{message}}</h2>
        </div>
        `
    const filled_HTMLTemplate = JSUtils.replaceTemplatePlaceholders(mapOverlay_HTMLTemplate,
        {
            message: message
        });

    const htmlNode = JSUtils.txtToHTMLNode(filled_HTMLTemplate)

    divToOverlay.append(htmlNode)
}


// Sucripción a cambios de measurements
myState.subscribe("onMeasurementsChanged", (activeMeasurements) => {

    if (!activeMeasurements || activeMeasurements.length == 0) {
        //@TODO: Show popup of nothing to visualize
        toggleDivOverlay(true,
            document.querySelector("#map"),
            "Select some data so that the map can plot measurements ")
        mapAllowInteraction(map, false)
        return
    }
    else {
        toggleDivOverlay(false, document.querySelector("#map"))
        mapAllowInteraction(map, true)
    }

    //This needs to be called when the map is initialized with data
    showNumericPropertiesAsSelect(
        getFilterablePropertiesList(myState._activeMeasurements[0].fullCellSignalStrength?.type),
        myState.visualizingProperty, (value) => {
            myState.visualizingProperty = value
        }
    )
    const defaultLatLon = { lat: 40.4233828, lon: -3.7121647 } //Plaza mayor
    // RESETEO LA POSICIÓN DEL CENTRO DEL MAPA
    visualizationCenter = myState.activeSessions.length > 0 ? getAverageLatLng(myState.activeSessions.map(s => s.worldPosition)) : defaultLatLon;

    showMeasurementsAsTable(MEASUREMENTS_DIV,
        myState.activeMeasurements,
        fetchMeasurementsIntoState
    )

})

myState.subscribe("onVisualizedPropertyChanged", (property) => {
    // renderMap(map, visualizationCenter,
    //     myState.activeSessions,
    //     myState.activeMeasurements,
    //     0,
    //     property
    // )
})


//TODO estimate values for different values being visualized
map.on("dblclick", (e) => {

    console.groupCollapsed("Point Estimation Tests : on Map DBL click (📍❓)")
    const toEstimatePoint = {
        lat: e.latlng.lat,
        lon: e.latlng.lng
    }
    console.log("📍 toEstimatePoint ", toEstimatePoint)


    const knownDataPoints = myState.activeMeasurements.map(p => {
        // console.log("p", p)
        return { ...p.position, value: p.fullCellSignalStrength[myState.visualizingProperty] /*should be dbm by default*/, ...localToGeo(p.position.x, p.position.z, visualizationCenter.lat, visualizationCenter.lon) }
    })

    console.log("📍📍📍 KnownDataPoints ", knownDataPoints)
    const estimated = estimateValueIDW_LatLong(toEstimatePoint, knownDataPoints, 0.000009);

    console.log(`🆒 ESTIMATED DBM for unknown point at (${toEstimatePoint.lat}, ${toEstimatePoint.lon}) = ${estimated}`)


    const popupDataForItem = `<div class="tooltip-point-detail">  
<header > 
    <h4>{{title}}</h4>
</header>
<div class="center"> 
  {{value}} {{unit}}
</div>
<footer>
</footer>
</div>`
    const popupDataForItemReplaced = JSUtils.replaceTemplatePlaceholders(popupDataForItem,
        {
            title: "Estimated point",
            value: estimated.toFixed(2),
            unit: getPropertyUnit(myState.visualizingProperty)
        })

    //Create a circle to show the estimated point visually
    const estimatedPoint = L.circle(toEstimatePoint, {
        color: "#32cd9f",
        fillOpacity: 0.5,
        radius: 0.05,
        className: "estimated-point"
    })
        .bindTooltip(`${myState.visualizingProperty} :  ${estimated.toFixed(2)} ${getPropertyUnit(myState.visualizingProperty)}`)
        .bindPopup(popupDataForItemReplaced)
        .addTo(map)
        .openPopup()

    console.groupEnd()
})




