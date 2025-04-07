function fetchDistrictBoundary(districtCodes) {
    return fetch(`/fetchDistrictExtend?stateCode=23&districtCodes=${districtCodes}`)
        .then(response => response.json())
        .then(data => {
            return JSON.parse(data.geom);  // Parse the GeoJSON boundary
        });
}


map.on('draw:created', function (e) {
    let drawnLine = e.layer.toGeoJSON();  // Convert drawn line to GeoJSON
    let drawnCoords = drawnLine.geometry.coordinates;  // Get coordinates

    fetchDistrictBoundary(selectedDistrictCodes).then(districtBoundary => {
        let inside = drawnCoords.every(coord =>
            turf.booleanPointInPolygon(turf.point(coord), districtBoundary)
        );

        if (!inside) {
            Swal.fire({
                icon: "error",
                title: "Invalid Line",
                text: "Please draw the line inside the selected district boundary!",
            });

            map.removeLayer(e.layer);  // Remove invalid drawn line
        }
    });
});

///////////////////////////////////////// 222222222222222222222222222///////////////////////



map.on('draw:created', function (e) {
    let drawnLine = e.layer.toGeoJSON();  // Convert drawn line to GeoJSON
    let drawnCoords = drawnLine.geometry.coordinates;  // Get coordinates

    fetchDistrictBoundary(selectedDistrictCodes).then(districtBoundary => {
        let startPoint = turf.point(drawnCoords[0]);  // First point
        let endPoint = turf.point(drawnCoords[drawnCoords.length - 1]);  // Last point

        let isStartInside = turf.booleanPointInPolygon(startPoint, districtBoundary);
        let isEndInside = turf.booleanPointInPolygon(endPoint, districtBoundary);

        if (!isStartInside || !isEndInside) {
            Swal.fire({
                icon: "error",
                title: "Invalid Line",
                text: "Please draw the line inside the selected district boundary!",
            });

            map.removeLayer(e.layer);  // Remove the invalid drawn line
        }
    });
});


/////////////////////////////////////   freehand /////////////////////////////////////////



map.on('draw:created', function (e) {
    let drawnLine = e.layer.toGeoJSON();  // Convert drawn line to GeoJSON
    let drawnCoords = drawnLine.geometry.coordinates;  // Get all coordinates (array of [lng, lat])

    fetchDistrictBoundary(selectedDistrictCodes).then(districtBoundary => {
        // Check if every point in the drawn line is inside the district boundary
        let isValid = drawnCoords.every(coord => {
            let point = turf.point(coord);  // Convert to Turf.js point
            return turf.booleanPointInPolygon(point, districtBoundary);
        });

        if (!isValid) {
            Swal.fire({
                icon: "error",
                title: "Invalid Freehand Drawing",
                text: "Please draw inside the selected district boundary!",
            });

            map.removeLayer(e.layer);  // Remove the invalid freehand drawing
        }
    });
});


/////////////////////////////////////////



// Create a FeatureGroup to store drawn items
let drawnItems = new L.FeatureGroup();
map.addLayer(drawnItems);

// Capture drawn objects (both line & freehand)
map.on('draw:created', function (e) {
    let layer = e.layer;  // Get the drawn layer
    drawnItems.addLayer(layer);  // Add to FeatureGroup
});



document.getElementById("clearButton").addEventListener("click", function () {
    drawnItems.clearLayers();  // Remove all drawn elements (lines + freehand)
});

