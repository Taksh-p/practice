var districtBoundary; // Store the district boundary

async function fetchDistrictBoundary(stateCode, districtCodes) {
    try {
        const response = await fetch(`/fetchDistrictExtend?stateCode=${stateCode}&districtCodes=${districtCodes}`);
        const data = await response.json();

        if (data.geom) {
            districtBoundary = new ol.format.GeoJSON().readGeometry(JSON.parse(data.geom));
            districtBoundary.transform('EPSG:4326', 'EPSG:3857'); // Convert to map projection
        } else {
            console.error("No boundary data received.");
        }
    } catch (error) {
        console.error("Error fetching district boundary:", error);
    }
}


fetchDistrictBoundary(sid, disid); // Fetch boundary based on state and district


clickEvent = async (evt) => {
    if (!districtBoundary) {
        alert("District boundary not loaded. Please wait...");
        return;
    }

    var lonlat = ol.proj.transform(evt.coordinate, 'EPSG:3857', 'EPSG:4326');
    var clickedPoint = new ol.geom.Point(evt.coordinate);

    // **Check if the clicked point is inside the district boundary**
    if (!districtBoundary.intersectsCoordinate(evt.coordinate)) {
        alert("You cannot draw a point outside your assigned district!");
        return; // Stop further execution
    }

    lat_long_list.push([lonlat[0], lonlat[1]]);

    if (lat_long_list.length == 1) {
        $("#dprsourcemp").val(`Point(${lonlat[0]} ${lonlat[1]})`);
        addPointToMap(lonlat[0], lonlat[1], 'Source');
    } 
    else if (lat_long_list.length == 2) {
        $("#dprdestinationmp").val(`Point(${lonlat[0]} ${lonlat[1]})`);
        addPointToMap(lonlat[0], lonlat[1], 'Destination');

        // **Validate if the entire line is inside the boundary**
        var lineGeometry = new ol.geom.LineString([lat_long_list[0], lat_long_list[1]]);
        if (!districtBoundary.intersectsExtent(lineGeometry.getExtent())) {
            alert("The drawn line crosses outside your district boundary!");
            return;
        }

        // Draw the valid line
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
