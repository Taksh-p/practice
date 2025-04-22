async function basiclayersNew(layers_b, printwkt1, uploadedFeatures) {
    $('#printwkt').val(printwkt1);

    // Calculate length
    let totalLength = 0;
    if (printwkt1) {
        let wktFeature = new ol.format.WKT().readFeature(printwkt1, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        if (wktFeature) {
            let geometry = wktFeature.getGeometry();
            if (geometry instanceof ol.geom.LineString) {
                totalLength += geometry.getLength();
            } else if (geometry instanceof ol.geom.MultiLineString) {
                geometry.getLineStrings().forEach(lineString => {
                    totalLength += lineString.getLength();
                });
            }
        }
    }

    if (uploadedFeatures && uploadedFeatures.length > 0) {
        uploadedFeatures.forEach(feature => {
            let geometry = feature.getGeometry();
            let projected = geometry.clone().transform('EPSG:4326', 'EPSG:3857');
            if (projected instanceof ol.geom.LineString) {
                totalLength += projected.getLength();
            } else if (projected instanceof ol.geom.MultiLineString) {
                projected.getLineStrings().forEach(lineString => {
                    totalLength += lineString.getLength();
                });
            }
        });
    }

    let lengthInKilometers = await findRoadLength(printwkt1);
    if (lengthInKilometers !== null && lengthInKilometers !== undefined) {
        $("#roadlength").html((lengthInKilometers / 1000).toFixed(2) + ' km');
    }

    // Add base layers
    for (let i = 0; i < layers_b.length; i++) {
        geomintersectlayer[i] = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: contextPath + mapwmsurl71,
                crossOrigin: 'anonymous',
                params: {
                    'LAYERS': layers_b[i],
                    format_options: 'dpi:180',
                    VERSION: '1.1.1',
                    STYLES: ''
                }
            }),
            showLegend: false,
            name: 'geomintersectlayer',
            visible: true
        });
        map.addLayer(geomintersectlayer[i]);
    }

    // Prepare land data
    let land_data = JSON.parse($("#landTable").val());
    layers_inter.push(...land_data);

    // 🔄 Replace chunking with backend spatial filtering API call
    try {
        const response = await fetch(contextPath + '/api/spatial/filter', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                wkt: printwkt1,
                layersIntersects: layers_inter,
                layersDwithin: layers_dwith
            })
        });

        const filteredGeometries = await response.json();

        for (const [key, wktArray] of Object.entries(filteredGeometries)) {
            const layerName = key.replace(/^intersects_|^dwithin_/, '');
            const isIntersect = key.startsWith("intersects_");
            const styleSet = isIntersect ? inter_style : dwith_style;
            const layerIndex = isIntersect ? layers_inter.indexOf(layerName) : layers_dwith.indexOf(layerName);
            const style = styleSet && styleSet[layerIndex];

            const vectorSource = new ol.source.Vector({
                features: wktArray.map(wkt =>
                    new ol.format.WKT().readFeature(wkt, {
                        dataProjection: 'EPSG:4326',
                        featureProjection: 'EPSG:3857'
                    })
                )
            });

            const vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: isIntersect ? 'blue' : 'green',
                        width: 3
                    })
                })
            });

            map.addLayer(vectorLayer);
        }
    } catch (error) {
        console.error("Error fetching spatial filtered data:", error);
    }

    // Draw uploaded KML features
    let kmlExtent;
    if (uploadedFeatures && uploadedFeatures.length > 0) {
        let kmlLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: uploadedFeatures }),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({ color: 'red', width: 5 })
            })
        });

        map.addLayer(kmlLayer);
        kmlExtent = kmlLayer.getSource().getExtent();
    }

    // Draw WKT line
    if (printwkt1) {
        let wktFeature = new ol.format.WKT().readFeature(printwkt1, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        if (wktFeature) {
            let geomType = wktFeature.getGeometry().getType();
            if (geomType === "MultiLineString") {
                let coords = wktFeature.getGeometry().getCoordinates();
                coords = coords.map(line => line.map(coord => [coord[0], coord[1]]));
                wktFeature.getGeometry().setCoordinates(coords);
            }

            let wktLayer = new ol.layer.Vector({
                source: new ol.source.Vector({ features: [wktFeature] }),
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({ color: 'red', width: 5 })
                })
            });

            map.addLayer(wktLayer);

            let wktExtent = wktLayer.getSource().getExtent();
            if (kmlExtent) {
                kmlExtent = ol.extent.extend(kmlExtent, wktExtent);
            } else {
                kmlExtent = wktExtent;
            }
        }
    }

    // Zoom to extent
    if (kmlExtent) {
        const zoomLevel = calculateZoomLevelNew(kmlExtent);
        map.getView().fit(kmlExtent, {
            duration: 1000,
            size: map.getSize(),
            maxZoom: zoomLevel
        });
    }

    legendarrayNew();
}


@PostMapping("/api/spatial/filter")
public ResponseEntity<Map<String, List<String>>> getSpatialFilteredGeometries(
    @RequestBody SpatialFilterRequest request) {
    
    Map<String, List<String>> result = new HashMap<>();

    for (String layer : request.getLayersIntersects()) {
        List<String> features = spatialService.getIntersectingGeometries(layer, request.getWkt());
        result.put("intersects_" + layer, features);
    }

    for (String layer : request.getLayersDwithin()) {
        List<String> features = spatialService.getDwithinGeometries(layer, request.getWkt(), 1); // 1 km
        result.put("dwithin_" + layer, features);
    }

    return ResponseEntity.ok(result);
}


@Data
public class SpatialFilterRequest {
    private String wkt;
    private List<String> layersIntersects;
    private List<String> layersDwithin;
}


public List<String> getIntersectingGeometries(String table, String wkt) {
    String sql = "SELECT ST_AsText(geom) FROM " + table + " WHERE ST_Intersects(geom, ST_GeomFromText(?, 4326))";
    return jdbcTemplate.queryForList(sql, new Object[]{wkt}, String.class);
}

public List<String> getDwithinGeometries(String table, String wkt, double distanceKm) {
    String sql = "SELECT ST_AsText(geom) FROM " + table + " WHERE ST_DWithin(geom, ST_GeomFromText(?, 4326), ?, false)";
    return jdbcTemplate.queryForList(sql, new Object[]{wkt, distanceKm * 1000}, String.class);
}
