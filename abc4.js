var districtBoundary; // Store the district boundary

// Function to fetch the boundary from the backend
async function fetchDistrictBoundary(districtId) {
    const response = await fetch(`/api/getDistrictBoundary?districtId=${districtId}`);
    const geojson = await response.json();
    
    districtBoundary = new ol.format.GeoJSON().readGeometry(geojson);
    districtBoundary.transform('EPSG:4326', 'EPSG:3857'); // Convert to map projection
}

fetchDistrictBoundary(disid); // Pass the user's district ID

clickEvent = async (evt) => {
    var lonlat = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
    var latitude = lonlat[0];
    var longitude = lonlat[1];
    var clickedPoint = new ol.geom.Point(ol.proj.fromLonLat([latitude, longitude]));

    // **Check if the point is inside the user's district boundary**
    if (!districtBoundary.intersectsCoordinate(evt.coordinate)) {
        alert("You cannot draw a line outside your assigned district!");
        return; // Stop further execution
    }

    // **Proceed if the point is inside**
    lat_long_list.push([latitude, longitude]);

    if (lat_long_list.length == 1) {
        $("#dprsourcemp").val("Point(" + latitude + " " + longitude + ")");
        addPointToMap(latitude, longitude, 'Source');
    } 
    else if (lat_long_list.length == 2) {
        $("#dprdestinationmp").val("Point(" + latitude + " " + longitude + ")");
        addPointToMap(latitude, longitude, 'Destination');

        // **Check if the full line is within the district boundary**
        var lineGeometry = new ol.geom.LineString([lat_long_list[0], lat_long_list[1]]);
        if (!districtBoundary.intersectsExtent(lineGeometry.getExtent())) {
            alert("The drawn line crosses outside your district boundary!");
            return;
        }

        // Draw the line if it's valid
        drawLine(lat_long_list);
    }
};


function addPointToMap(latitude, longitude, label) {
    var geom = new ol.format.WKT().readGeometry(`Point(${latitude} ${longitude})`);
    geom.transform('EPSG:4326', 'EPSG:3857');

    var feature = new ol.Feature({
        geometry: geom,
        name: 'Point'
    });

    var pointStyle = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 4,
            fill: new ol.style.Fill({ color: 'red' }),
            stroke: new ol.style.Stroke({ color: [255, 0, 0], width: 1 })
        }),
        text: new ol.style.Text({
            text: label,
            offsetY: 10,
            scale: 1.3,
            fill: new ol.style.Fill({ color: '#000000' })
        })
    });

    var source = new ol.source.Vector({ features: [feature] });
    var layer = new ol.layer.Vector({ source: source, style: [pointStyle] });

    map.addLayer(layer);
}

function drawLine(coords) {
    var lineString = new ol.format.WKT().readGeometry(`LINESTRING(${coords[0][0]} ${coords[0][1]}, ${coords[1][0]} ${coords[1][1]})`);
    lineString.transform('EPSG:4326', 'EPSG:3857');

    var feature = new ol.Feature({
        geometry: lineString,
        name: 'Line'
    });

    var lineStyle = new ol.style.Style({
        stroke: new ol.style.Stroke({
            color: 'blue',
            width: 3
        }),
        text: new ol.style.Text({
            text: 'Distance',
            fill: new ol.style.Fill({ color: '#e30e0e' }),
            font: 'bold 12px Arial',
            scale: 1.3,
            offsetX: 10,
            offsetY: 10
        })
    });

    var source = new ol.source.Vector({ features: [feature] });
    var vectorLayer = new ol.layer.Vector({ source: source, style: [lineStyle] });

    map.addLayer(vectorLayer);
}


map.on('singleclick', function (evt) {
    if (!districtBoundary) {
        alert("District boundary is not loaded yet. Please wait...");
        return;
    }
    clickEvent(evt);
});
