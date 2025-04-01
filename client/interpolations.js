/* Estimación de valor usando Inverse distance weighing : Una media ponderada en base a la distancia 

    dataPoint debe tener esta pinta: {x, y, z, value}
    knownDataPoints debe ser un array de [{x,y,z,value}]
    searchRadius: un número


*/
export function estimateValueIDW(dataPoint, knownDataPoints, searchRadius, p = 1) {

    //Get datapoints that fall with the search radius
    const nearbyDataPoints = knownDataPoints.
        map(kdp => {
            return {
                ...knownDataPoints,
                distance: getEuclideanDistance(dataPoint, kdp)
            }
        }
        ).filter(kdp => kdp.distance <= searchRadius)


    let weightedValueSummatory = 0;
    let weightsSummatory = 0;

    nearbyDataPoints.forEach(kdp => {
        const w_i = 1 / kdp.distance * p // w : ponderador
        const v_i = kdp.value

        weightedSum += w_i * v_i
        weightsSummatory += w_i;
    });

    let estimatedValue = weightedValueSummatory / weightsSummatory;

    return estimatedValue

}


//TESTED
export function estimateValueIDW_LatLong(dataPoint, knownDataPoints, searchRadius, p = 1) {

    //Get datapoints that fall with the search radius
    const nearbyDataPoints = knownDataPoints.
        map(kdp => {
            return {
                ...kdp,
                distance: getHaversineDistanceKM(dataPoint.lat, dataPoint.lon, kdp.lat, kdp.lon) / 1000
            }
        }
        ).filter(kdp => kdp.distance <= searchRadius)


    // console.log("NEARBY Data points",nearbyDataPoints )


    let weightedValueSummatory = 0;
    let weightsSummatory = 0;

    nearbyDataPoints.forEach(kdp => {
        const w_i = 1 / kdp.distance * p // w : ponderador
        const v_i = kdp.value

        weightedValueSummatory += w_i * v_i
        weightsSummatory += w_i;
    });




    let estimatedValue = weightedValueSummatory / weightsSummatory;

    // console.groupCollapsed("harvesineComputation ")
    // console.log("wValueSum =", weightedValueSummatory)
    // console.log("wSummatory =", weightsSummatory)
    // console.log("estimation = wValueSum/wSummatory =", estimatedValue)
    // console.groupEnd()

    return estimatedValue

}





//https://en.wikipedia.org/wiki/Euclidean_distance
export function getEuclideanDistance(p1, p2) {

    return Math.sqrt(
        Math.pow((p1.x - p2.x, 2))
        + Math.pow((p1.y - p2.y, 2))
        + Math.pow((p1.z - p2.z, 2)))

}








export function getHaversineDistanceKM(lat1Deg, lon1Deg, lat2Deg, lon2Deg) {
    function toRad(degree) {
        return degree * Math.PI / 180;
    }

    const lat1 = toRad(lat1Deg);
    const lon1 = toRad(lon1Deg);
    const lat2 = toRad(lat2Deg);
    const lon2 = toRad(lon2Deg);

    const { sin, cos, sqrt, atan2 } = Math;

    const R = 6371; // earth radius in km 
    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;
    const a = sin(dLat / 2) * sin(dLat / 2)
        + cos(lat1) * cos(lat2)
        * sin(dLon / 2) * sin(dLon / 2);
    const c = 2 * atan2(sqrt(a), sqrt(1 - a));
    const d = R * c;

    // console.log("Computed harvesine distance", d)

    return d; // distance in km
}










export function dotProduct(p1, p2) {
    return (p1.x * p2.x) + (p1.y * p2.y) + (p1.z * p2.z)
}







export function generatePointsInRadius(centerX, centerY, radius, numPoints) {
    const points = [];
  


    for (let i = 0; i < numPoints; i++) {
      // Generate a random angle (in radians)
      const angle = Math.random() * 2 * Math.PI;
      // Generate a random distance within the circle (square root ensures uniform distribution)
      const distance = Math.sqrt(Math.random()) * radius;
  
      // Convert polar coordinates to Cartesian coordinates
      const x = centerX + distance * Math.cos(angle);
      const y = centerY + distance * Math.sin(angle);
  
    console.log(`CENTER IS ${centerX} ${centerY}`)
      points.push({ lat:x, lon:y });
    }
  
    return points;
  }