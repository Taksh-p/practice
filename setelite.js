function seteliteToggle() {
    var layerss = findlayeByName(navigationmap.getLayerGroup(), 'name', 'High Resolution Image ');
    if (!layerss) {
        return;
    }

    let geojsonData = [];
    if (selectedDistrictCodes.length === 0) {
        geojsonData = getlayerjson("state_boundary_21_03_2023", "stcode11", "23");
    } else {
        const districtCodes = selectedDistrictCodes.map(code => `'${code}'`).join(', ');
        geojsonData = getlayerjson1("district_boundary_21_03_2023", "district_c", districtCodes);
    }

    const polygons = [];

    if (geojsonData && Array.isArray(geojsonData)) {
        geojsonData.forEach(item => {
            if (item && item.st_asgeojson) {
                try {
                    const geometry = JSON.parse(item.st_asgeojson);

                    // Normalize both Polygon and MultiPolygon as MultiPolygon
                    if (geometry.type === "Polygon") {
                        polygons.push(geometry.coordinates);
                    } else if (geometry.type === "MultiPolygon") {
                        geometry.coordinates.forEach(mp => polygons.push(mp));
                    }

                } catch (e) {
                    console.error("Error parsing GeoJSON:", e);
                }
            }
        });
    }

    const combinedGeoJSON = {
        type: "FeatureCollection",
        features: [{
            type: "Feature",
            geometry: {
                type: "MultiPolygon",
                coordinates: polygons
            },
            properties: {}
        }]
    };

    const clipsource = new ol.source.Vector({
        features: (new ol.format.GeoJSON()).readFeatures(combinedGeoJSON, {
            featureProjection: 'EPSG:3857',
            dataProjection: "EPSG:4326"
        })
    });

    const clipLayer = new ol.layer.Vector({
        source: clipsource
    });

    const style = new ol.style.Style({
        fill: new ol.style.Fill({
            color: "blue"
        })
    });

    layerss.postrenderHandler = function (e) {
        const vectorContext = ol.render.getVectorContext(e);
        if (!vectorContext) return;
        e.context.globalCompositeOperation = "destination-in";
        clipLayer.getSource().forEachFeature(function (feature) {
            vectorContext.drawFeature(feature, style);
        });
        e.context.globalCompositeOperation = "source-over";
    };

    layerss.on("postrender", layerss.postrenderHandler);
}
