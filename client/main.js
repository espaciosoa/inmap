



/** Function to transform coordinates respect to the "defined origin" to latitute and logitude */
function localToGeo(x, y, lat0, lon0) {
    const metersPerDegreeLat = 111320; // Approximate at equator
    const metersPerDegreeLon = 111320 * Math.cos(lat0 * (Math.PI / 180)); // Adjust for latitude

    const deltaLat = y / metersPerDegreeLat;
    const deltaLon = x / metersPerDegreeLon;

    return {
        lat: lat0 + deltaLat,
        lon: lon0 + deltaLon
    };
}


function validateLat(lat) {
    // [-90, 90] latitude

    if (!isNumber(lat))
        throw new Error("Lat to validate is not a number ")

    if (lat < -90 || lat > 90)
        throw new Error("Lat to validate is not in the range [-90, 90]")

    return lat;
}



function validateLong(long) {
    // [-180, 180] longitude

    if (!isNumber(long))
        throw new Error("Lat to validate is not a number ")

    if (long < -180 || long > 180)
        throw new Error("Lat to validate is not in the range [-90, 90]")

    return long;
}




function isNumber(value) {
    return typeof value === 'number';
}


// Function to convert degrees to radians
function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

// Function to rotate a point around an origin
function rotatePointMap(lat, lng, originLat, originLng, angle) {
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


