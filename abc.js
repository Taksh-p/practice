async function fetchBoundaryExtent(sid, disidArray) {
    boundaryExtent = null;
    
    // Ensure disidArray is an array (multiple districts)
    if (!Array.isArray(disidArray)) {
        disidArray = [disidArray]; // Convert single district to array
    }

    var boundaryData = getBoundry(sid, disidArray); 

    if (boundaryData && boundaryData.length > 0) {
        var combinedExtent = [Infinity, Infinity, -Infinity, -Infinity]; // [minX, minY, maxX, maxY]

        boundaryData.forEach(boundary => {
            combinedExtent[0] = Math.min(combinedExtent[0], boundary.minx);
            combinedExtent[1] = Math.min(combinedExtent[1], boundary.miny);
            combinedExtent[2] = Math.max(combinedExtent[2], boundary.maxx);
            combinedExtent[3] = Math.max(combinedExtent[3], boundary.maxy);
        });

        boundaryExtent = combinedExtent;
    } else {
        console.error("No boundary data found.");
    }
}



const districtBoundaries = [];

boundaryData.forEach(boundary => {
    const transformedExtent = ol.proj.transformExtent(
        [boundary.minx, boundary.miny, boundary.maxx, boundary.maxy], 
        'EPSG:4326', 'EPSG:3857'
    );

    const polygon = turf.polygon([[
        [transformedExtent[0], transformedExtent[1]], // Bottom Left
        [transformedExtent[0], transformedExtent[3]], // Top Left
        [transformedExtent[2], transformedExtent[3]], // Top Right
        [transformedExtent[2], transformedExtent[1]], // Bottom Right
        [transformedExtent[0], transformedExtent[1]]  // Closing
    ]]);

    districtBoundaries.push(polygon);
});

const unifiedBoundary = turf.multiPolygon(districtBoundaries.map(poly => poly.geometry.coordinates));

const lineCoords = lineString.getCoordinates();
const linePolygon = turf.lineString(lineCoords);
const isContained = turf.booleanWithin(linePolygon, unifiedBoundary);

if (isContained) {
    console.log("Valid Line within multiple districts.");
} else {
    Swal.fire("Invalid line. Please draw within your assigned districts.");
    lat_long_list = [];
    clearMapmp();
    map.un('singleclick', clickEvent);
}
