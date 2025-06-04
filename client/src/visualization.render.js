import { initPopup } from "./popup.js"
import { LEAFLET_POPUP_HTML_TEMPLATE } from "./leaflet.templates.js"
import JSUtils from "./Helpers.js"
import {
    localToGeo, validateLat, validateLong, isNumber, rotatePointMap,
    getAverageLatLng, getDistanceInMeters
}
    from "./geo.utils.js"
import { estimateValueIDW_LatLong, generatePointsInRadius, getLatLongBoundingBox } from "./interpolations.js"
import { getNaturalLanguageDate } from "./converters.js"
import { getPropertyUnit, getFilterablePropertiesList, getNormalizedValueInRange, getPropertyColorForValue, getPropertyRange } from "../../dist/crap.js"

import { SwitchComponent } from "./components/switch.component.js"


// I am using these to group logically related elements in the map (e.g., all measurements related to a session, the heatmap, etc)
export let layerGroups = []

//Plaza mayor
export const defaultLatLon = { lat: 40.4233828, lon: -3.7121647 }
let visualizationCenter = defaultLatLon;



function clearMapLayers(map) {
    layerGroups.forEach((l) => {
        console.log("Removing map layer for rerendering", l)
        map.removeLayer(l.layer)
    })
    layerGroups = []
}

function clearMapLayerByName(map, layerName) {
    layerGroups = layerGroups.filter((layerInfo) => {
        if (layerInfo.name === layerName) {
            //Removes the layer from the actual map, not just the object
            map.removeLayer(layerInfo.layer)
            return false
        }
        else
            return true
    })
}






// I should probably get different data from the Raspberry to use
const toMapPointsMapper = (measurement) => {

    //We want to treat differently the measurements made with the raspberry
    if ("measurementDevice" in measurement
        && measurement.measurementDevice === "RaspberryPi4B"
    ) {

        //Extract the bare basics
        let adaptedMeasurementObject = {
            _id: measurement._id,
            ...measurement.position,
            timestamp: measurement.timestamp,
            sessionId: measurement.measurementSession,
            measurementDevice: measurement.measurementDevice

        }

        const originalAllMeasurements = measurement.allMeasurements


        const FILTER_TECH = "LTE";

        console.log("PROCESSING PI MEASUREMENT LOOKING LIKE THIS", originalAllMeasurements)

        //Decompose 
        // adaptedMeasurementObject.fullCellSignalStrength = {}
        //rssi
        adaptedMeasurementObject.rssi = originalAllMeasurements.signalStrength.rssi;
        adaptedMeasurementObject.channelBitErrorRate = originalAllMeasurements.signalStrength.channelBitErrorRate;
        //TODO!
        //Careful if it returns an array because it means there are several technologies . Get prx
        adaptedMeasurementObject.qrsrp = (originalAllMeasurements?.qrsrp.filter((elem) => elem.radioAccessTech === FILTER_TECH))[0]?.prx ?? "IDK"
        adaptedMeasurementObject.qrsrq = (originalAllMeasurements?.qrsrq.filter((elem) => elem.radioAccessTech === FILTER_TECH))[0]?.prx ?? "IDK"
        adaptedMeasurementObject.sinr = (originalAllMeasurements?.sinr.filter((elem) => elem.radioAccessTech === FILTER_TECH))[0]?.prx ?? "IDK"
        //Cell info
        adaptedMeasurementObject.cellInfo = { ...(originalAllMeasurements.servingCell.cells.filter((elem) => elem.accessTechnology && elem.accessTechnology === FILTER_TECH))?.[0] } ?? "Unsupported cell (NOT 5G or 4G)"


        adaptedMeasurementObject = { ...adaptedMeasurementObject, ...adaptedMeasurementObject.cellInfo }



        return adaptedMeasurementObject

    }

    return {
        _id: measurement._id,
        ...measurement.position,
        ...measurement.fullCellSignalStrength,
        ...measurement.fullCellIdentity,
        timestamp: measurement.timestamp,
        //This is now passed but is a bad estimation of position
        worldCoordsNotWorking: measurement.worldCoords,
        sessionId: measurement.measurementSession,
        measurementDevice: measurement.measurementDevice || "ANDROID_PHONE"
    }
}



/**
 * `map`: the leaflet map object in which I want to show overlays with my data
 * `visCenter`: {lat:X, long:Y} object where the map will have its center
 * points: array of points with the data to paint
 * */
export async function renderMap(map,
    sessions,
    points,
    rotation = 0,
    whatToDisplay = 'level') {


    const [showPopup, hidePopup, destroyPopup] = initPopup()


    const SHOW_BBOX = true
    const RENDER_HEATMAP = true


    // RESETEO LA POSICIÓN DEL CENTRO DEL MAPA
    visualizationCenter = sessions.length > 0 ? getAverageLatLng(sessions.map(s => s.worldPosition)) : defaultLatLon;
    const visCenter = visualizationCenter
    console.log("Rendering map 🗺️ with center at", visCenter)

    map.setView([visCenter.lat, visCenter.lon])




    showPopup("Re-rendering map", "load")
    console.log("RENDER MAP")


    clearMapLayers(map)

    if (!points || !sessions)
        return

    //This reformats the points to have a common interface (kinda)
    points = points.map(toMapPointsMapper)

    //1. Show visually the estimated centroid of all measured points    
    //This is the estimated center 
    // let center = L.circle(visCenter, {
    //     color: 'black',
    //     fillOpacity: 1,
    //     radius: 0.5
    // })
    //     .bindPopup(`Estimated visualization center:  (${visCenter.lat}, ${visCenter.lon} )`).addTo(map)


    // layerGroups.push({ name: "Estimated visualization center", layer: center })

    let renderPromisesList = []


    const allSessionsLayerGroup = L.layerGroup().addTo(map);

    /* Iterate over sessions and display their data */
    sessions.forEach(s => {

        if (!s.worldPosition)
            return

        // Get Rasberry Pi measurements for the session (also order by most recent if there are several assigned to same session)
        const piCorrectionPoints = points.filter(p =>
            p.sessionId === s._id && p.measurementDevice === "RaspberryPi4B").sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))

        // Phone measurements for this session
        const nonPiMeasurementPointsForSession = points.filter(p =>
            p.sessionId === s._id && p.measurementDevice !== "RaspberryPi4B")

        const singleSessionLayerGroup = L.layerGroup().addTo(map); // Layer to store session info in a group
        const singleSessionMeasurementsLayerGroup = L.layerGroup().addTo(map); // Layer to store measurements in a group


        //PLOT INFO OF A SPECIFIC SESSION
        renderSession(singleSessionLayerGroup, s, piCorrectionPoints[0],
            //What happens on toggle of the corrections
            // @HERE ALREYLZ
            function (active, session) {

                if (active) {
                    clearMapLayerByName(map, `MeasurementsForSession'${session._id}'`)
                    clearMapLayerByName(map, `heatmap`)
                    // Performing estimations
                    // 1. I need the pi-measurement data
                    // referencePiMeasurePoint
                    // 2. I neeed the rest of the measurements

                    //3. Compute closest measured value
                    const closestRealPointToPiMeasurement = nonPiMeasurementPointsForSession.map(realPoint => {
                        const ownOrigin = session.worldPosition

                        const computedPointWorldCoords = localToGeo(realPoint.x, realPoint.z, ownOrigin.lat, ownOrigin.lon)

                        return {
                            ...realPoint,
                            distanceToSeshOrigin: getDistanceInMeters(computedPointWorldCoords.lat, computedPointWorldCoords.lon, ownOrigin.lat, ownOrigin.lon)
                        }
                    }
                    ).sort((a, b) => a.distanceToSeshOrigin - b.distanceToSeshOrigin)[0]; // ← Sort by distance (ascending)



                    // 3. Compute bias
                    console.log("COMPARISON VALUE", closestRealPointToPiMeasurement)
                    console.log("REFERENCE VALUE", piCorrectionPoints[0])


                    function diffSharedNumericKeys(obj1, obj2) {
                        const result = {};
                        for (const key in obj1) {
                            if (key in obj2) {
                                const val1 = Number(obj1[key]);
                                const val2 = Number(obj2[key]);
                                if (!isNaN(val1) && !isNaN(val2)) {
                                    result[key] = val1 - val2;

                                    console.log(`phone(${key}) - ref(${key})`, result)
                                }
                            }
                        }
                        return result;
                    }


                    //phone.pci should be the same as pi.pcid (it is the cell id)
                    //earfcn should also be the same

                    // rssi of both (check valid values)



                    const res = diffSharedNumericKeys(closestRealPointToPiMeasurement, piCorrectionPoints[0])




                    console.log("Diff object", res)
                    alert("Missing tests with 5G")

                }

                //RERENDER 
                renderMeasurementsForSession(singleSessionMeasurementsLayerGroup, session, nonPiMeasurementPointsForSession, whatToDisplay, 0,

                )
                renderHeatmap(map, sessions, points.filter(p => p.measurementDevice !== "RaspberryPi4B"), whatToDisplay)
                //RE-REFRESH ALSO THE HEATMAP



            }

        )



        if (nonPiMeasurementPointsForSession.length > 0) {


            if (SHOW_BBOX) {
                // Compute bounding box
                const boundingBoxForSessionMeasurements = getLatLongBoundingBox(nonPiMeasurementPointsForSession.map(coord => {
                    const ownOrigin = s.worldPosition
                    const thisSessionCoordsAsLatLong = localToGeo(coord.x, coord.z, ownOrigin.lat, ownOrigin.lon)
                    return { lat: thisSessionCoordsAsLatLong.lat, lon: thisSessionCoordsAsLatLong.lon }
                }))

                const bboxInputToLeaflet = [[boundingBoxForSessionMeasurements.minLat, boundingBoxForSessionMeasurements.minLon],
                [boundingBoxForSessionMeasurements.maxLat, boundingBoxForSessionMeasurements.maxLon]]


                const boundingBoxForSessionLayerGroup = L.layerGroup().addTo(map);

                console.log(`BOUNDING BOX FOR SESSION ${JSON.stringify(boundingBoxForSessionMeasurements)}`, s)
                if (bboxInputToLeaflet)
                    L.rectangle(
                        bboxInputToLeaflet,
                        { color: "#ff7800", weight: 0.1 }).addTo(boundingBoxForSessionLayerGroup);

            }



            //PLOT MEASUREMENTS FOR A SPECIFIC SESSION
            const pointRenderingPromise = renderMeasurementsForSession(singleSessionMeasurementsLayerGroup, s, nonPiMeasurementPointsForSession, whatToDisplay)
            renderPromisesList.push(pointRenderingPromise)
            console.log("promse rendering", pointRenderingPromise)

            singleSessionLayerGroup.addTo(singleSessionMeasurementsLayerGroup)

        }

        //add to layers for then removal
        layerGroups.push({ name: `SingleSessionLayer ${s._id}`, layer: singleSessionLayerGroup })
        //Add single session layer to layer group

        allSessionsLayerGroup.addLayer(singleSessionLayerGroup)
    })

    //add to layers for then removal
    layerGroups.push({ name: "AllSessionsLayer", layer: allSessionsLayerGroup })



    if (RENDER_HEATMAP) {
        // console.log("POINTS (PRE HEATMAP)", points)
        // Phone measurements for this session
        const nonPiMeasurementPoints = points.filter(p =>
            p.measurementDevice !== "RaspberryPi4B")

        console.log(nonPiMeasurementPoints)
        renderHeatmap(map, sessions, nonPiMeasurementPoints, whatToDisplay);
    }

    console.log("MAP LAYERS", layerGroups)

    await Promise.all(renderPromisesList)

    destroyPopup()

}






/**
 * Renders the origins of sessions along with the popups with information about the session and whether correction is possible
 * @param {*} map 
 * @param {*} session 
 * @param {*} piCorrectionPoint 
 */
function renderSession(sessionMapLayer, session, piCorrectionPoint = null, onCorrectionToggle) {

    const referencePiMeasurePoint = piCorrectionPoint
    console.log(`Reference PI_MEASUREMENT point for sesssion ${session._id} `, referencePiMeasurePoint ?? "NONE")

    // Template displaying the information about a pi measurement
    const PI_CORRECTION_SECTION_HTML_TEMPLATE = `
        <div class="pi-correction-for-session-available" >
                {{pi_details}}
                {{switch}}
                <span> 
                    <span class="key"> Measurement device :</span> 
                    <span class="value">  {{device}} </span> 
                </span> 
                <span> 
                    <span class="key" title="Received Signal Strength Indicator"> RSSI :</span> 
                    <span class="value">  {{rssi}} </span> 
                </span> 
                <span> 
                    <span class="key" title=""> Channel bit error rate :</span> 
                    <span class="value">  {{channelBitErrorRate}} </span> 
                </span> 
                <span> 
                    <span class="key" title="Reference Signal Received Power"> QRSRP :</span> 
                    <span class="value">  {{qrsrp}} </span> 
                </span> 
                <span> 
                    <span class="key" title="Reference Signal Received Quality"> QRSRQ :</span> 
                    <span class="value">  {{qrsrq}} </span> 
                </span> 
                <span> 
                    <span class="key" title="Signal-to-Interference-plus-Noise Ratio"> sinr :</span> 
                    <span class="value">  {{sinr}} </span> 
                </span> 
                <span> 
                    <span class="key"> cellType :</span> 
                    <span class="value">  {{cellType}} </span> 
                </span> 
            </div>
        `
    // Switch to enable or disable the correction
    const piCorrectionSwitch = SwitchComponent(
        "Raspbi Correction",
        false,
        (ev) => {
            const isOn = ev.target.checked
            alert(`THE SWITCH INPUT IS ${isOn ? "ON" : "OFF"} for session ${session}`)
            onCorrectionToggle?.(isOn, session)
        })


    //this  goes when there are actually pi-measurements
    const PiMeasurementsTemplateReplacements = {
        // pi_details: JSON.stringify(referencePiMeasurePoint),
        device: referencePiMeasurePoint?.measurementDevice,
        rssi: referencePiMeasurePoint?.rssi,
        channelBitErrorRate: referencePiMeasurePoint?.channelBitErrorRate,
        qrsrp: referencePiMeasurePoint?.qrsrp,
        qrsrq: referencePiMeasurePoint?.qrsrq,
        sinr: referencePiMeasurePoint?.sinr,
        cellType: referencePiMeasurePoint?.cellInfo,
        switch: piCorrectionSwitch
    }

    const raspberryPiRefValues = referencePiMeasurePoint ? JSUtils.
        replaceTemplatePlaceholdersAndBindHandlers(PI_CORRECTION_SECTION_HTML_TEMPLATE,
            PiMeasurementsTemplateReplacements
        ) : null;


    //This shows all relevant details details of a session
    const SESSION_DETAIL_HTML_TEMPLATE = `
            <div class="session-details" >
                <span> 
                    <span class="key"> Id :</span> 
                    <span class="value">  {{id}} </span> 
                </span> 
                <span> 
                    <span class="key"> CreatedAt :</span>  
                    <span class="value"> {{createdAt}} </span> 
                </span>
                <span> 
                    <span class="key"> 📍 WorldPosition (Lat, Lon) : </span>  
                    <span class="value"> ({{lat}} , {{lon}}) </span>
                </span>
                <span> 
                    <span class="key"> 👤 CreatedBy :</span>  
                    <span class="value"> {{creator}} </span>
                </span> 
                <span>
                    <span class="key"> 💬 Comments :</span> 
                    <span class="value">  {{comment}} </span>
                </span>
                <span> 
                    <span class="key"> 📱 MeasurementDevice : </span> 
                    <span class="value"> {{device}} </span>
                </span>
            </div>
        `
    const sessionDetail = JSUtils.
        replaceTemplatePlaceholdersAndBindHandlers(
            SESSION_DETAIL_HTML_TEMPLATE,
            {
                id: session._id,
                createdAt: `⌚ ${getNaturalLanguageDate(session.timestamp)}`,
                lat: session.worldPosition.lat,
                lon: session.worldPosition.lon,
                creator: session.measurementsOwner ?? "Owner not specified",
                comment: session.comment ?? "No comment for this session",
                device: session.measurementDevice
            }
        );


    //Put all together in an info popup
    const SESSION_INFO_POPUP_HTML_TEMPLATE =
        `<div class="tooltip-detail">  
                <header class="tooltip-header" >  
                    {{title}}
                </header>
                <div class="tooltip-body" >
                    {{sessionDetail}}
                    {{raspberryPiRefValues}}
                <div>
                {{popupButtons}}
                <footer>
                   
                </footer>
        </div>`


    const replacements = {
        title: `👁️ Measurement Session`,
        sessionDetail: sessionDetail,
        raspberryPiRefValues: raspberryPiRefValues ?? JSUtils.replaceTemplatePlaceholdersAndBindHandlers("<span> No RaspberryPi reference measurements found </span>"),
    }



    const popupSession = JSUtils.
        replaceTemplatePlaceholdersAndBindHandlers(SESSION_INFO_POPUP_HTML_TEMPLATE,
            replacements
        )



    //DISPLAY ORIGINS
    let sessionOriginMarker = L.marker(session.worldPosition, {
        color: 'orange',
        fillOpacity: 0.5,
        radius: 0.5
    })
        .bindPopup(popupSession)
        .addTo(sessionMapLayer);
}




function renderMeasurementsForSession(theseMeasurementsMapLayer, session, measurements, whatToDisplay, rotation = 0, correction = null) {


    const renderPromises = []


    // DISPLAY POINTS
    measurements.forEach(c => {

        if (session._id !== c.sessionId)
            throw new Error("renderMeasurementsForSession() called with non-matching sessions and measurements")


        const ownOrigin = session.worldPosition

        if (!ownOrigin)
            return

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


        //depending on what to display
        // CHECK that the property to be show in the visualization is in the coe
        if (!(whatToDisplay in c)) {
            // throw new Error(`unknown data attribute specified ${whatToDisplay} `)
            return
        }


        const promise = new Promise(resolve => {
            setTimeout(() => {

                //Represents a measurement
                let measurementPointInMap = L.circle(latLongCoords, {
                    className: 'animated-marker',
                    color:
                        getPropertyColorForValue(whatToDisplay, c[whatToDisplay]),
                    fillOpacity: 0.5,
                    radius: 0.05
                })
                    .bindTooltip(`${whatToDisplay} :  ${c[whatToDisplay]} ${getPropertyUnit(whatToDisplay)}`)
                    .bindPopup(popupDataForItemReplaced).addTo(theseMeasurementsMapLayer);

                resolve(); // mark this point as rendered
            }, 1)
        })

        renderPromises.push(promise);
    })
    //add to list of layered info, so that re-rendering on change origin can move printed 
    layerGroups.push({ name: `MeasurementsForSession'${session._id}'`, layer: theseMeasurementsMapLayer })

    return Promise.all(renderPromises)
}



let zoomListener = null;
function renderHeatmap(map, sessions, nonPiMeasurementPoints, valueKey /* what to display */) {



    // Give shape as {lat: -- . lon: -- , value: --}
    const knownPointsHeatmapReady = nonPiMeasurementPoints.flatMap(c => {
        const ownOrigin = sessions.filter(s => s._id === c.sessionId)[0]?.worldPosition

        if (ownOrigin == undefined) return []

        const localRoomCoordsAsLatLong = localToGeo(c.x, c.z, ownOrigin.lat, ownOrigin.lon)
        return {
            ...localRoomCoordsAsLatLong, value: c[valueKey] //c.dbm
        }
    })


    const heatmapConfig = {
        radius: 20,
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




    // console.log("HEATMAP READY", knownPointsHeatmapReady)


    //This generates fake points for the heatmap
    // Generate many points in a radius that will be used for the point cloud
    // const pointCloudRadiusPoints = generatePointsInRadius(visCenter.lat, visCenter.lon,
    //     Math.max(bbox.maxLat - bbox.minLat, bbox.maxLon - bbox.minLon) /* 0.0002*/
    //     ,
    //     /* Changeme */ 5000)


    // console.log("POINT CLOUD RADIUS POINTS", pointCloudRadiusPoints)

    // pointCloudRadiusPoints.forEach(p => {
    //     // Debug point
    //     console.log("showing circle as debug point")
    //     L.circle(p, {
    //         color: "pink",
    //         fillOpacity: 0.5,
    //         radius: 1
    //     }).bindPopup("debug point").addTo(map)

    // })

    // const heatmapData = pointCloudRadiusPoints.map(c => {
    //     return {
    //         ...c,
    //         value: estimateValueIDW_LatLong(c, knownPointsHeatmapReady, 0.0002)
    //     }
    // }
    // )



    const propertyRange = getPropertyRange(valueKey)

    // Heatmap js requires this type of input
    const HMPoints = {
        max: propertyRange.max ?? knownPointsHeatmapReady.reduce((max, obj) => obj.value > max ? obj.value : max, -Infinity),
        min: propertyRange.min ?? knownPointsHeatmapReady.reduce((min, obj) => obj.value < min ? obj.value : min, Infinity),
        data: knownPointsHeatmapReady
    };


    console.log("HEATMAP-POINTS  🔥", HMPoints)

    const heatmapLayer = new HeatmapOverlay(heatmapConfig);


    //Heatmap layer should be showing
    heatmapLayer.setData(HMPoints)

    heatmapLayer.addTo(map)

    // Wait for canvas to be created and then trigger fade-in
    setTimeout(() => {
        const canvasLayer = document.querySelector('.leaflet-heatmap-layer');
        if (canvasLayer) {
            canvasLayer.classList.add('canvas-visible');
        }
    }, 50); // small delay to ensure DOM is ready


    console.log("HEATMAP LAYER", heatmapLayer)
    layerGroups.push({ name: "heatmap", layer: heatmapLayer })


    function handleConstantSizeHeatmapRegardlessOfZoom() {

        function metersToPixels(meters, lat) {
            const zoom = map.getZoom();
            return meters / (156543.03392 * Math.cos((lat * Math.PI) / 180) / Math.pow(2, zoom));
        }

        const center = map.getCenter();
        const pixelRadius = metersToPixels(10, center.lat); // Example: 500 meters
        heatmapLayer.cfg.radius = pixelRadius;
        heatmapLayer._heatmap.configure({ radius: pixelRadius });
        console.log("Handling constant sizeHeatmap regardless of Zoom")
    }


    if (!zoomListener)
        zoomListener = handleConstantSizeHeatmapRegardlessOfZoom;
    // Update radius dynamically on zoom (subscribed just once)
    map.on("zoomend", zoomListener);


}






function correctedValuesWithPiMeasurementForSession(session, refMeasurement, measurements) {

    // get bias between refMeasurement and closest point

    measurements
    const bias = linearCorrect(refMeasurement, measurements)



    return


}




function linearCorrect(refValue, toCorrectValue) {

    const bias = refValue - toCorrectValue
    // const corrected = toCorrectValue + bias

    // return corrected
    return bias
}

function scaleCorrect(refValue, toCorrectValue) {

    const scaleBias = refValue / toCorrectValue;
    const corrected = toCorrectValue * scaleBias
    // return corrected

    return scaleBias

}



