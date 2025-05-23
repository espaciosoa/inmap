// Main file for the client side
import {
    localToGeo, validateLat, validateLong, isNumber, rotatePointMap,
    getAverageLatLng
}
    from "./src/geo.utils.js"

import { LEAFLET_POPUP_HTML_TEMPLATE } from "./src/leaflet.templates.js"


import { getRooms, getSessions, getMeasurements } from "/src/requests.js"
import { requestIAAPI, requestIATraining, requestTrainingJobStatus, requestIAAPIReal } from "./src/requests.ia.js"
import { loadBase64Image } from "./src/image.utils.js"


import { getNaturalLanguageDate } from "./src/converters.js"
import { estimateValueIDW_LatLong, generatePointsInRadius, getLatLongBoundingBox } from "./src/interpolations.js"


import JSUtils from "./src/Helpers.js"
import {
    showRoomsAsSelectOptions, showSessionsAsCheckboxes, showNumericPropertiesAsSelect,
    showMeasurementsAsTable, showRoomAsTable, showSessionsAsTables


} from "./src/DynamicHtml.js"

import { initPopup } from "./src/popup.js"

import { getPropertyUnit, getFilterablePropertiesList, getNormalizedValueInRange, getPropertyColorForValue } from "./dist/crap.js"
import { PageState } from "./dist/PageState.js"

const [showPopup, hidePopup] = initPopup()

showPopup("Loading data from API", "load")

console.groupCollapsed("API Rest Data: 📱📏📶📱📏📶📱📏📶")
showPopup("Loading rooms", "load")
const allRooms = await getRooms();
console.log("🏠 ROOMS ", allRooms)
showPopup("Loading sessions from API", "load")
const allSessions = await getSessions()
console.log("📱📏 SESSIONS ", allSessions)
showPopup("Loading measurements from API", "load")
const allMeasurements = await getMeasurements();
console.log("📶 MEASUREMENTS ", allMeasurements)
console.groupEnd()

hidePopup()




// Encapsulating state in an object
const myState = new PageState(
    "visualization_state",
    /*default room */ allRooms[0],
    /*default sessions */ allSessions.filter(s => s.roomId == allRooms[0]._id),
    /*visualizing property*/ "dbm"
)


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
    showSessionsAsCheckboxes(sessionsCheckboxContainer, myState, myState.activeSessions.map(s => s), myState.activeSessions)
    showStateInformationSection(myState)
    const activeSessionIds = myState.activeSessions.map(s => s._id)
    myState.activeMeasurements = allMeasurements.filter(m => activeSessionIds.includes(m.measurementSession))
    showRoomAsTable(ROOM_DIV,
        myState.activeRoom
    )
    showSessionsAsTables(SESSIONS_DIV,
        myState.activeSessions
    )
    showMeasurementsAsTable(MEASUREMENTS_DIV,
        myState.activeMeasurements
    )
};



// Make UI react to changes 
myState.subscribe("onActiveRoomChanged", (activeRoom) => {
    showSessionsAsCheckboxes(sessionsCheckboxContainer,
        myState,
        allSessions.filter(s => s.roomId == activeRoom._id),
        allSessions.filter(s => s.roomId == activeRoom._id))
    myState.activeSessions = allSessions.filter(s => s.roomId == activeRoom._id)
    showRoomAsTable(ROOM_DIV, activeRoom)
})

myState.subscribe("onActiveSessionsChanged", (activeSessions) => {
    showPopup("Loading measurements", "load")
    const activeSessionIds = activeSessions.map(s => s._id)
    // console.log("CHANGED SELECTED SESSIONS ", activeSessions)
    // console.log("Active session ids", activeSessionIds)
    myState.activeMeasurements = allMeasurements.filter(m => activeSessionIds.includes(m.measurementSession))
    // console.log("SETTING APPROPIATE MEASUREMENTS", myState.activeMeasurements)
    showSessionsAsTables(SESSIONS_DIV,
        myState.activeSessions
    )
    hidePopup()
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
        measurements: state.activeMeasurements.length
    })




    const measurementsContainer = document.querySelector("#measurements")

    const myStateSummaryAlmostFilled = JSUtils.txtToHTMLNode(myStateSummary)
    const sessionsContainer = myStateSummaryAlmostFilled.querySelector(".sessions-displayed-list")

    sessionsContainer.replaceChildren(...allSessionSpansNodes)
    measurementsContainer.replaceChildren(myStateSummaryAlmostFilled)

}



// -----------------------------------
// MAPPING WITH LEAFLET AND HEATMAP.JS
// -----------------------------------







if (!myState.activeMeasurements)
    document.querySelector("#map").append("No map to show")
//HAndle case when origins are not defined???









let visualizationCenter = {
    lat: myState.activeSessions[0].worldPosition.lat,
    lon: myState.activeSessions[0].worldPosition.lon
}




// console.warn("@alreylz - USING ANONYMIZED ORIGIN")
// origin = { lat: 40.41523, lon: -3.70711 }







const MAP_PROVIDERS = {
    openstreetmap: {
        urlTemplate: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
        options: {
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }
    },
    arcgis: {
        urlTemplate: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        options: {
            attribution: 'Tiles &copy; Esri'
        }
    },
    mapbox: {
        urlTemplate: "https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}",
        options: {
            attribution: '&copy; <a href="https://www.mapbox.com/">Mapbox</a>',
            id: 'mapbox/light-v11',
            tileSize: 512,
            zoomOffset: -1,
            accessToken: "pk.eyJ1IjoiYWxyZXlsIiwiYSI6ImNsZDY5YzR1ajBkcGQ0MXBsdWgzem90aHQifQ.jbSFWt0Q8y_DZRYBUNiKrA",
        },
        mapboxStyles: {
            streets: "mapbox/streets-v12",
            outdoors: "mapbox/outdoors-v12",
            light: "mapbox/light-v11",
            dark: "mapbox/dark-v11",
            satellite: "mapbox/satellite-v9",
            satelliteStreets: "mapbox/satellite-streets-v12",
            navigationDay: "mapbox/navigation-day-v1",
            navigationNight: "navigation-night-v1"
        }
    },
    cartoDB: {
        urlTemplate: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
        options: {
            subdomains: 'abcd',
            attribution: '&copy; <a href="https://carto.com/">CARTO</a>',
        }
    }



}


// Init map
let layerGroups = []


const baseMaps = {}
for (const [providerName, config] of Object.entries(MAP_PROVIDERS)) {

    if (providerName !== "mapbox") {
        baseMaps[`${providerName}`] = L.tileLayer(
            config.urlTemplate,
            {
                ...config.options,
                maxZoom: 30
            })
    }
    else {

        for (const [variationName, styleUrl] of Object.entries(config.mapboxStyles)) {
            console.log(`${variationName}, ${styleUrl}`)
            baseMaps[`${providerName}-${variationName}`] = L.tileLayer(
                config.urlTemplate,
                {
                    ...config.options,
                    id: styleUrl,
                    maxZoom: 30
                })
        };

    }

}




console.log("BASE TILES AVAILABLE", baseMaps)
const map = L.map('map').setView([visualizationCenter.lat, visualizationCenter.lon], 19);
//SET DEFAULT BASE TILE
baseMaps.openstreetmap.addTo(map);
//Allow changing between providers
L.control.layers(baseMaps).addTo(map);



function toggleAllowInteraction(map, enabled) {



    if (!enabled) {
        console.log("DISABLING MAP CONTROLS")
        map.dragging.disable();
        map.touchZoom.disable();
        map.doubleClickZoom.disable();
        map.scrollWheelZoom.disable();
        map.boxZoom.disable();
        map.keyboard.disable();
        if (map.tap) map.tap.disable();
    }
    else {
        console.log("ENABLING MAP CONTROLS")
        map.dragging.enabled();
        map.touchZoom.enabled();
        map.doubleClickZoom.enabled();
        map.scrollWheelZoom.enabled();
        map.boxZoom.enabled();
        map.keyboard.enabled();
        if (map.tap) map.tap.enabled();


    }
}


map.on('zoomend', () => {
    const currentZoom = map.getZoom(); // Get current zoom level
    console.log('Current zoom level:', currentZoom);
    //Zoom 21 is the perfect
});









// let points = sessionMeasurements.map(measurement => {
//    
// })


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

if (myState.activeMeasurements && myState.activeSessions.length > 0) {
    // myState.visualizingProperty = "dbm"
    renderMap(
        map,
        visualizationCenter,
        myState.activeSessions,
        myState.activeMeasurements.map(toMapPointsMapper),
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







//NEED TO COMPUTE THE POSSIBLE numeric properties or have a constant of them






// Sucripción a cambios de measurements
myState.subscribe("onMeasurementsChanged", (activeMeasurements) => {

    //This needs to be called when the map is initialized with data
    showNumericPropertiesAsSelect(
        getFilterablePropertiesList(myState._activeMeasurements[0].fullCellSignalStrength?.type),
        myState.visualizingProperty, (value) => {
            myState.visualizingProperty = value

        }
    )

    // Disable interaction while map no measurements are chosen for display
    // toggleAllowInteraction(map, activeMeasurements.length === 0)

    const defaultLatLon = { lat: 40.4233828, lon: -3.7121647 } //Plaza mayor
    //RESETEO LA POSICIÓN DEL CENTRO DE LA VISUALIZACIÓN (DEL MAPA)
    visualizationCenter = myState.activeSessions.length > 0 ? getAverageLatLng(myState.activeSessions.map(s => s.worldPosition)) : defaultLatLon;
    console.log("VIS CENTER",)

    console.log("ACTIVE MEASUREMENTS CHANGED", activeMeasurements)


    renderMap(map, visualizationCenter, myState.activeSessions, activeMeasurements.map(toMapPointsMapper))




    showMeasurementsAsTable(MEASUREMENTS_DIV, structuredClone(activeMeasurements))
})


myState.subscribe("onVisualizedPropertyChanged", (property) => {
    renderMap(map, visualizationCenter, myState.activeSessions, myState.activeMeasurements.map(toMapPointsMapper), 0,
        /* */
        property
    )
})





const inputLat = document.querySelector("input[name=latitude]")
// inputLat.value = starting.lat
const inputLong = document.querySelector("input[name=longitude]")
// inputLong.value = starting.lon
const inputRot = document.querySelector("input[name=rotation]")
const form = document.querySelector(".viz-controls-form")



// reference of map events : https://leafletjs.com/reference.html#map-click     


//TODO estimate values for different values being visualized
map.on("dblclick", (e) => {

    console.groupCollapsed("Point Estimation Tests : on Map DBL click (📍❓)")

    // console.log("Data for click event", e)

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


function clearMapLayers(map) {
    layerGroups.forEach((l) => {
        console.log("removing map layer for rerendering", l)
        map.removeLayer(l.layer)
    })
    layerGroups = []
}





/**
 * origin : lat, lon object
 * points: array of points with the data to paint
 * */
function renderMap(map, visCenter, sessions, points, rotation = 0, whatToDisplay = 'level') {
    showPopup("Re-rendering map", "load")

    clearMapLayers(map)

    if (!points)
        return

    // whatToDisplay = whatToDisplay ?? 'level'

    console.log("Rendering map 🗺️ with center at", visCenter)

    map.setView([visCenter.lat, visCenter.lon])

    //This is the estimated center 

    let center = L.circle(visCenter, {
        color: 'black',
        fillOpacity: 1,
        radius: 0.5
    })
        .bindPopup(`Estimated visualization center:  (${visCenter.lat}, ${visCenter.lon} )`).addTo(map)

    layerGroups.push({ name: "Estimated visualization center", layer: center })


    const layerGroupOrigin = L.layerGroup().addTo(map);
    sessions.forEach(s => {



        //Get pi measurements (also order by most recent if there are several assigned to same session)
        const piCorrectionPoints = points.filter(p =>
            p.sessionId === s._id && p.measurementDevice === "RaspberryPi4B").sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))


        //DISPLAY ORIGINS
        let myOriginPainted = L.marker(s.worldPosition, {
            color: 'orange',
            fillOpacity: 0.5,
            radius: 0.5
        }).bindPopup(`This is the origin for session ${s._id} ${((piCorrectionPoints.length > 0) ? JSON.stringify(piCorrectionPoints) : "no pi measurements associated")}`)
            .addTo(layerGroupOrigin);


        //add to list of layered info, so that re-rendering on change origin can move printed 
        layerGroupOrigin.addLayer(myOriginPainted)

    })
    //add to layers for then removal
    layerGroups.push({ name: "sessionCenters", layer: layerGroupOrigin })

    const layerGroupOther = L.layerGroup().addTo(map);


    //This should be done in a different way, like having the needed data already computed (e.g., lat, lon) -> Called world position
    console.log("Computing bounding box of lat long")
    const bbox = getLatLongBoundingBox(points.map(p => {
        const ownOrigin = sessions.filter(s => s._id === p.sessionId)[0].worldPosition
        const thisRoomAllCoordsAsLatLong = localToGeo(p.x, p.z, ownOrigin.lat, ownOrigin.lon)
        return { lat: thisRoomAllCoordsAsLatLong.lat, lon: thisRoomAllCoordsAsLatLong.lon }
    }))

    // console.log("BBOX", bbox)
    // var imageUrl = 'https://maps.lib.utexas.edu/maps/historical/newark_nj_1922.jpg';
    // let imageBounds = [[bbox.minLat, bbox.minLon], [bbox.maxLat , bbox.maxLon]];
    // L.imageOverlay(imageUrl, imageBounds).addTo(map);




    //Print  saved from phone into database
    points.forEach(c => {
        const ownOrigin = sessions.filter(s => s._id === c.sessionId)[0].worldPosition // Get actual lat long origin for this point

        const localRoomCoordsAsLatLong = localToGeo(c.x, c.z, ownOrigin.lat, ownOrigin.lon)
        const latLongCoords = rotation === undefined ?
            localRoomCoordsAsLatLong : rotatePointMap(localRoomCoordsAsLatLong.lat, localRoomCoordsAsLatLong.lon, ownOrigin.lat, ownOrigin.lon, rotation)


        const popupDataForItem = LEAFLET_POPUP_HTML_TEMPLATE;

        const popupDataForItemReplaced = JSUtils.replaceTemplatePlaceholders(popupDataForItem,
            {
                title: `Measurement ${c._id}`,
                timestamp: getNaturalLanguageDate(c.timestamp),
                dbm: c.dbm,
                asuLevel: c.asuLevel,
                level: c.level,
                type: c.type,
                // restSignalData : `cqi:${c.cqi}, rsrp:${c.rsrp}, rssi:${c.rssi}`,
                operator: c.operatorAlphaLong,
                bandwidth: c.bandwidth
            })


        if (c.measurementDevice === "RaspberryPi4B") {
            console.warn("HEY, this session has a raspberry pi measurement")
            return

        }
        //depending on what to display
        // CHECK that the property to be show in the visualization is in the coe
        if (!(whatToDisplay in c)) {
            // throw new Error(`unknown data attribute specified ${whatToDisplay} `)

        }


        //Represents a measurement
        let circle = L.circle(latLongCoords, {
            color:
                getPropertyColorForValue(whatToDisplay, c[whatToDisplay]),
            // matchColorLevel(c.level || c.qualityLevel),
            fillOpacity: 0.5,
            radius: 0.05
        })
            .bindTooltip(`${whatToDisplay} :  ${c[whatToDisplay]} ${getPropertyUnit(whatToDisplay)}`)
            .bindPopup(popupDataForItemReplaced).addTo(layerGroupOther);

        //Adding to group
        layerGroupOther.addLayer(circle)
    })
    //add to list of layered info, so that re-rendering on change origin can move printed 
    layerGroups.push({ name: "actualPoints", layer: layerGroupOther })
    console.log("POINTS (PRE HEATMAP)", points)

    //Heatmap things
    showPopup("Creating heatmap points", "load")

    const knownPointsHeatmapReady = points.map(c => {

        const ownOrigin = sessions.filter(s => s._id === c.sessionId)[0].worldPosition // Get actual lat long origin for this point

        const localRoomCoordsAsLatLong = localToGeo(c.x, c.z, ownOrigin.lat, ownOrigin.lon)
        return {
            ...localRoomCoordsAsLatLong, value: c.dbm
        }
    })




    // Generate many points in a radius that will be used for the point cloud
    const pointCloudRadiusPoints = generatePointsInRadius(visCenter.lat, visCenter.lon, 0.0002, /* Changeme */ 1000)


    console.log("POINT CLOUD RADIUS POINTS", pointCloudRadiusPoints)

    // pointCloudRadiusPoints.forEach(p => {
    //     // Debug point
    //     console.log("showing circle as debug point")
    //     L.circle(p, {
    //         color: "pink",
    //         fillOpacity: 0.5,
    //         radius: 1
    //     }).bindPopup("debug point").addTo(map)

    // })

    // toEstimatePoint, knownDataPoints, 0.000009);



    const heatmapData = pointCloudRadiusPoints.map(c => {
        return {
            ...c,
            value: estimateValueIDW_LatLong(c, knownPointsHeatmapReady, 0.0002)
        }
    }
    )



    const testHMPoints = {
        max: heatmapData.reduce((max, obj) => obj.value > max ? obj.value : max, -Infinity),
        min: heatmapData.reduce((min, obj) => obj.value < min ? obj.value : min, Infinity),
        data: heatmapData
    };


    console.log("HEATMAP-POINTS  🔥", testHMPoints)
    const heatmapConfig = {
        radius: 10,
        maxOpacity: 0.3,
        gradient: {
            // enter n keys between 0 and 1 here
            // for gradient color customization

            '0': "#FF8282",
            '0.25': "#FFC482",
            '0.50': "#F0FF82",
            '0.60': "#82FF8A",
            '1': '#82CBFF'





        },
        // scaleRadius: true,
        // useLocalExtrema: true,
        latField: "lat",
        lngField: "lon",
        valueField: "value"
    };

    const heatmapLayer = new HeatmapOverlay(heatmapConfig);
    console.log(heatmapLayer)
    layerGroups.push({ name: "layer", layer: heatmapLayer })


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
        const pixelRadius = metersToPixels(3, center.lat); // Example: 500 meters
        heatmapLayer.cfg.radius = pixelRadius;
        heatmapLayer._heatmap.configure({ radius: pixelRadius });
    });
    // console.log(map.layers)

    hidePopup()

}








// const TEST_ROOM = "office01";
// let job = null

// document.querySelector(".ia-training-btn").addEventListener("click", async (ev) => {
//     console.log("Training button clicked")
//     job = await requestIATraining(TEST_ROOM)

//     alert("Training job started, check console for updates")
//     alert(JSON.stringify(job))
//     console.log("JOB ID", job)

// })

// document.querySelector(".ia-status-btn").addEventListener("click", async (ev) => {


//     const jobStatus = await requestTrainingJobStatus(job.job_id)

//     alert("Training job started, check console for updates")
//     alert(JSON.stringify(jobStatus))

// })
// document.querySelector(".ia-inference-btn").addEventListener("click", async (ev) => {


//     console.log("Inference button clicked")
//     const inference = await requestIAAPIReal(TEST_ROOM)

//     alert("Inference done check console for updates. Should be the image", inference)

// })







// @todo : HERE I WAS DOING TESTS WITH THE IA API
// try {
//     var imgData = await requestIAAPI()
//     console.log("IMG DATA", imgData)
//     var myImg = loadBase64Image(imgData.base64)

//     //Do request 
//     console.log(requestIATraining("paci2"))

//     // var imageUrl = 'https://maps.lib.utexas.edu/maps/historical/newark_nj_1922.jpg',
//     let imageBounds = [[40.4233828, -3.7121647], [40.4233828 + 1, -3.7121647 + 1]];
//     L.imageOverlay(myImg, imageBounds).addTo(map);

// }
// catch (e) {
//     console.warn("Error loading image (maybe IA endpoint is not active)", e)
// }


