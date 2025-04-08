async function fetchBoundaryExtent(sid, disidArray) {
    if (!Array.isArray(disidArray)) {
        disidArray = [disidArray]; // Convert single district to array
    }

    return new Promise((resolve, reject) => {
        $.ajax({
            url: "/getboundryextent",
            type: "POST",
            contentType: "application/json",
            data: JSON.stringify({ sid: sid, disid: disidArray }),
            success: function (response) {
                if (response && response.length > 0) {
                    resolve(response); // Return boundary data
                } else {
                    reject("No boundary data found.");
                }
            },
            error: function (err) {
                reject(err);
            }
        });
    });
}



async function processBoundaries(sid, disidArray) {
    try {
        const boundaryData = await fetchBoundaryExtent(sid, disidArray);

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
        
        return unifiedBoundary; // Return the merged boundary
    } catch (error) {
        console.error("Error fetching boundaries:", error);
        return null;
    }
}


async function validateLine(sid, disidArray, lineString) {
    const unifiedBoundary = await processBoundaries(sid, disidArray);

    if (!unifiedBoundary) {
        Swal.fire("Error fetching boundary data.");
        return;
    }

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
}
