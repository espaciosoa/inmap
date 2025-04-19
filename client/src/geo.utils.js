/**
 * @fileoverview  Here functions to perform oprations on coordinates of the world map and transformations from local space are defined
 */


/** Transforms coordinates respect to the "defined origin" to latitute and logitude */
export function localToGeo(x, y, lat0, lon0) {
    const metersPerDegreeLat = 111320; // Approximate at equator
    const metersPerDegreeLon = 111320 * Math.cos(lat0 * (Math.PI / 180)); // Adjust for latitude

    const deltaLat = y / metersPerDegreeLat;
    const deltaLon = x / metersPerDegreeLon;

    return {
        lat: lat0 + deltaLat,
        lon: lon0 + deltaLon
    };
}



/**
 * Given a list of coordinates (as object {lat,lon} ), returns the average latitude and longitude
 * @param {*} coords 
 * @throws {Error} If the coordinates are not valid
 * @returns an object with the average latitude and longitude {lat: averageLat, lon: averageLon}
 */
export function getAverageLatLng(coords) {
    let sumLat = 0, sumLng = 0;
    const count = coords.length;

    coords.forEach(coord => {
        sumLat += validateLat(coord.lat);
        sumLng += validateLong(coord.lon); 
    });

    return { lat: sumLat / count, lon: sumLng / count }; // Returns the average lat/lng
}




export function isNumber(value) {
    return typeof value === 'number';
}


// Function to convert degrees to radians
export function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Function to rotate a point around an origin
export function rotatePointMap(lat, lng, originLat, originLng, angle) {
    const theta = toRadians(angle);

    // Convert latitude/longitude to Cartesian coordinates (approximation)
    const x = lng;
    const y = lat;
    const x0 = originLng;
    const y0 = originLat;

    // Apply rotation formula
    const xPrime = x0 + (x - x0) * Math.cos(theta) - (y - y0) * Math.sin(theta);
    const yPrime = y0 + (x - x0) * Math.sin(theta) + (y - y0) * Math.cos(theta);

    return [yPrime, xPrime]; // Return as [latitude, longitude]
}


/**
 * 
 * @param {Number} lat Latitude number to validate
 * @throws {Error} If the latitude is not a number or is not in the range [-90, 90]
 * @returns the validated latitude
 */
export function validateLat(lat) {
    // [-90, 90] latitude

    if (!isNumber(lat))
        throw new Error("Lat to validate is not a number ")

    if (lat < -90 || lat > 90)
        throw new Error("Lat to validate is not in the range [-90, 90]")

    return lat;
}

/**
 * 
 * @param {Number} long  Longitude number to validate
 * @throws {Error} If the longitude is not a number or is not in the range [-180, 180] 
 * @returns the validated longitude
 */
export function validateLong(long) {
    // [-180, 180] longitude

    if (!isNumber(long))
        throw new Error("Lat to validate is not a number ")

    if (long < -180 || long > 180)
        throw new Error("Lat to validate is not in the range [-90, 90]")

    return long;
}



export function validateLatLong(lat, long) {
    validateLat(lat);
    validateLong(long);
    return [lat, long];
}