import { initPopup } from "./popup.js"
import { LEAFLET_POPUP_HTML_TEMPLATE } from "./leaflet.templates.js"
import JSUtils from "./Helpers.js"
import {
    localToGeo, validateLat, validateLong, isNumber, rotatePointMap,
    getAverageLatLng
}
    from "./geo.utils.js"
import { estimateValueIDW_LatLong, generatePointsInRadius, getLatLongBoundingBox } from "./interpolations.js"
import { getNaturalLanguageDate } from "./converters.js"
import { getPropertyUnit, getFilterablePropertiesList, getNormalizedValueInRange, getPropertyColorForValue } from "../../dist/crap.js"

import { SwitchComponent } from "./components/switch.component.js"


const [showPopup, hidePopup] = initPopup()


// I can use these to group elements in the map
let layerGroups = []

function clearMapLayers(map) {
    layerGroups.forEach((l) => {
        console.log("removing map layer for rerendering", l)
        map.removeLayer(l.layer)
    })
    layerGroups = []
}


// I should probably get different data from the Raspberry to use
const toMapPointsMapper = (measurement) => {

    //We want to treat differently the measurements made with the raspberry
    if ("measurementDevice" in measurement
        && measurement.measurementDevice === "RaspberryPi4B"
    ) {

        //Extract the bare basics
        const adaptedMeasurementObject = {
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
        adaptedMeasurementObject.cellInfo = { ...(originalAllMeasurements.servingCell.cells.filter((elem) => elem.accessTechnology && elem.accessTechnology === FILTER_TECH))?.[0] } && "Unsupported cell (NOT 5G or 4G)"


        return adaptedMeasurementObject

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



/**
 * `map`: the leaflet map object in which I want to show overlays with my data
 * `visCenter`: {lat:X, long:Y} object where the map will have its center
 * points: array of points with the data to paint
 * */
export function renderMap(map,
    visCenter,
    sessions,
    points,
    rotation = 0,
    whatToDisplay = 'level') {





    showPopup("Re-rendering map", "load")

    clearMapLayers(map)

    if (!points || !sessions)
        return

    //This reformats the points to have a common interface (kinda)
    points = points.map(toMapPointsMapper)

    console.log("Rendering map 🗺️ with center at", visCenter)

    map.setView([visCenter.lat, visCenter.lon])

    //1. Show visually the estimated centroid of all measured points    
    //This is the estimated center 
    // let center = L.circle(visCenter, {
    //     color: 'black',
    //     fillOpacity: 1,
    //     radius: 0.5
    // })
    //     .bindPopup(`Estimated visualization center:  (${visCenter.lat}, ${visCenter.lon} )`).addTo(map)


    // layerGroups.push({ name: "Estimated visualization center", layer: center })


    const layerGroupOrigin = L.layerGroup().addTo(map);

    sessions.forEach(s => {

        //Get pi measurements (also order by most recent if there are several assigned to same session)
        const piCorrectionPoints = points.filter(p =>
            p.sessionId === s._id && p.measurementDevice === "RaspberryPi4B").sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))


        const referencePiMeasurePoint = piCorrectionPoints[0] 
        console.log(`Reference PI_MEASUREMENT point for sesssion ${s._id} `, referencePiMeasurePoint?? "none")




        //I need to create a button only if there are pi-measurements
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



        const piCorrectionSwitch = SwitchComponent("Raspbi Correction",
            (ev) => {
                const isOn = ev.target.checked
                alert(`THE SWITCH INPUT IS ${isOn ? "ON" : "OFF"}`)
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

        const raspberryPiRefValues = JSUtils.
            replaceTemplatePlaceholdersAndBindHandlers(PI_CORRECTION_SECTION_HTML_TEMPLATE,
                PiMeasurementsTemplateReplacements
            );


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
                    id: s._id,
                    createdAt: `⌚ ${getNaturalLanguageDate(s.timestamp)}`,
                    lat: s.worldPosition.lat,
                    lon: s.worldPosition.lon,
                    creator: s.measurementsOwner ?? "Owner not specified",
                    comment: s.comment ?? "No comment for this session",
                    device: s.measurementDevice
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
        let myOriginPainted = L.marker(s.worldPosition, {
            color: 'orange',
            fillOpacity: 0.5,
            radius: 0.5
        })
            .bindPopup(popupSession)
            // .bindPopup(`
            //     This is the origin for session ${s._id} ${((piCorrectionPoints.length > 0) ? JSON.stringify(piCorrectionPoints) : "no pi measurements associated")}
            //     `)
            .addTo(layerGroupOrigin);
        //add to list of layered info, so that re-rendering on change origin can move printed 
        layerGroupOrigin.addLayer(myOriginPainted)
    })

    //add to layers for then removal
    layerGroups.push({ name: "sessionCenters", layer: layerGroupOrigin })

    const layerGroupOther = L.layerGroup().addTo(map);


    //This should be done in a different way, like having the needed data already computed (e.g., lat, lon) -> Called world position
    // console.log("Computing bounding box of lat long")
    //TODO HERE : Plotting actual bounding box
    // const nonPiMeasurementPoints = points.filter((p) => p.measurementDevice !== "RaspberryPi4B")

    // console.log("nonPiMeasurements", nonPiMeasurementPoints)
    // const bbox = getLatLongBoundingBox(nonPiMeasurementPoints.map(p => {
    //     const ownOrigin = sessions.filter(s => s._id === p.sessionId)[0].worldPosition
    //     const thisRoomAllCoordsAsLatLong = localToGeo(p.x, p.z, ownOrigin.lat, ownOrigin.lon)
    //     return { lat: thisRoomAllCoordsAsLatLong.lat, lon: thisRoomAllCoordsAsLatLong.lon }
    // }))

    // console.log("BBOX", bbox)
    // var imageUrl = 'https://maps.lib.utexas.edu/maps/historical/newark_nj_1922.jpg';
    // let imageBounds = [[bbox.minLat, bbox.minLon], [bbox.maxLat, bbox.maxLon]];
    // L.imageOverlay(imageUrl, imageBounds).addTo(map);




    //Print  saved from phone into database
    points.forEach(c => {
        const ownOrigin = sessions.filter(s => s._id === c.sessionId)[0]?.worldPosition ?? null// Get actual lat long origin for this point

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