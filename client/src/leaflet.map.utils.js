/**
 * API TOKENS (In case you need to provide them)
 */
const MAPBOX_TOKEN = "pk.eyJ1IjoiYWxyZXlsIiwiYSI6ImNsZDY5YzR1ajBkcGQ0MXBsdWgzem90aHQifQ.jbSFWt0Q8y_DZRYBUNiKrA"


/* Configuration object for all supported MAP_PROVIDERS */
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
            accessToken: MAPBOX_TOKEN,
        },
        mapboxStyles: {
            // https://docs.mapbox.com/api/maps/styles/
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


/**
 * Initializes a map with a menu with multiple providers. `defaultProvider` is one of `[cartoDB,arcgis,mapbox,openstreetmap]`
 * You can pass an existing leaflet map instance to reuse via `existingMapInstance`
 */
export function initLeafletMapWithProviders(defaultProvider = "cartoDB", existingMapInstance) {
    //LEAFLET MAP OBJECT
    const leafletMap =  existingMapInstance ?? L.map('map') 

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
    //SET DEFAULT BASE TILE
    baseMaps[defaultProvider].addTo(leafletMap);
    //Allow changing between providers
    L.control.layers(baseMaps).addTo(leafletMap);
    return leafletMap
}



