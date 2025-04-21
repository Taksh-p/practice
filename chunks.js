async function basiclayersNew(layers_b, printwkt1, uploadedFeatures) {
    $('#printwkt').val(printwkt1);

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
            let projectedGeometry = geometry.transform('EPSG:4326', 'EPSG:3857');
            if (projectedGeometry instanceof ol.geom.LineString) {
                totalLength += projectedGeometry.getLength();
            } else if (projectedGeometry instanceof ol.geom.MultiLineString) {
                projectedGeometry.getLineStrings().forEach(lineString => {
                    totalLength += lineString.getLength();
                });
            }
        });
    }

    let lengthInKilometers = await findRoadLength(printwkt1);
    if (lengthInKilometers != null || lengthInKilometers != undefined) {
        $("#roadlength").html((lengthInKilometers / 1000).toFixed(2) + ' km');
    }

    for (let i = 0; i < layers_b.length; i++) {
        geomintersectlayer[i] = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: contextPath + mapwmsurl71,
                crossOrigin: 'anonymous',
                params: {
                    'LAYERS': layers_b[i],
                    format_options: 'dpi:180',
                    VERSION: '1.1.1',
                    STYLES: '',
                }
            }),
            showLegend: false,
            name: 'geomintersectlayer',
            visible: true
        });
        map.addLayer(geomintersectlayer[i]);
    }

    // ==================== CHUNKING ====================
    const chunkSize = 10;
    const wktFormat = new ol.format.WKT();
    let chunkedInterLayers = [];
    let chunkedDwithLayers = [];

    if (uploadedFeatures && uploadedFeatures.length > 0) {
        for (let i = 0; i < uploadedFeatures.length; i += chunkSize) {
            const chunk = uploadedFeatures.slice(i, i + chunkSize);
            let geometries = chunk.map(f => f.getGeometry().clone().transform('EPSG:4326', 'EPSG:4326'));

            let combinedGeometry;
            if (geometries[0] instanceof ol.geom.LineString) {
                combinedGeometry = new ol.geom.MultiLineString(geometries.map(g => g.getCoordinates()));
            } else if (geometries[0] instanceof ol.geom.Polygon) {
                combinedGeometry = new ol.geom.MultiPolygon(geometries.map(g => g.getCoordinates()));
            }

            const chunkWKT = wktFormat.writeGeometry(combinedGeometry);
            chunkedInterLayers.push("INTERSECTS(geom," + chunkWKT + ")");
            chunkedDwithLayers.push("DWITHIN(geom," + chunkWKT + ",1,kilometers)");
        }
    } else if (printwkt1) {
        chunkedInterLayers.push("INTERSECTS(geom," + printwkt1 + ")");
        chunkedDwithLayers.push("DWITHIN(geom," + printwkt1 + ",1,kilometers)");
    }

    // Static layers and styles
    var layers_inter = ["mppwd_road", "railway_track", "forest_india", "river_edrs_mord", "mp_major_lease", "drainage_edrs_mord"];
    var inter_style = ["mp_road_type", "Railway", "Forest", "River", null, "drainage_edrs_mord"];

    var layers_dwith = ["mp_udise_schools"];
    var dwith_style = ["School"];

    // ========== Add INTERSECTS layers ==========
    chunkedInterLayers.forEach((inter_layer) => {
        for (let i = 0; i < layers_inter.length; i++) {
            let dist = new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: contextPath + mapwmsurl71,
                    crossOrigin: 'anonymous',
                    params: {
                        'LAYERS': layers_inter[i],
                        'version': '1.1.1',
                        'format_options': 'dpi:110',
                        'CQL_FILTER': inter_layer,
                        ...(inter_style[i] ? { 'STYLES': inter_style[i] } : {})
                    }
                }),
                showLegend: true,
            });
            map.addLayer(dist);
        }
    });

    // ========== Add DWITHIN layers ==========
    chunkedDwithLayers.forEach((dwith_layer) => {
        for (let i = 0; i < layers_dwith.length; i++) {
            let dist_dwith = new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: contextPath + mapwmsurl71,
                    crossOrigin: 'anonymous',
                    params: {
                        'LAYERS': layers_dwith[i],
                        'version': '1.1.1',
                        'format_options': 'dpi:110',
                        'CQL_FILTER': dwith_layer,
                        ...(dwith_style[i] ? { 'STYLES': dwith_style[i] } : {})
                    }
                }),
                showLegend: true,
            });
            map.addLayer(dist_dwith);
        }
    });

    // Vector overlay: polygon from print WKT (optional overlay visual)
    if (printwkt1) {
        const polygonFeature = wktFormat.readFeature(printwkt1, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        const vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: [polygonFeature]
            }),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'blue',
                    width: 2,
                }),
            }),
        });

        map.addLayer(vectorLayer);
    }

    // Show uploaded KML features
    let kmlExtent;
    if (uploadedFeatures && uploadedFeatures.length > 0) {
        const kmlLayer = new ol.layer.Vector({
            source: new ol.source.Vector({
                features: uploadedFeatures
            }),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: 'red',
                    width: 5
                })
            })
        });
        map.addLayer(kmlLayer);
        kmlExtent = kmlLayer.getSource().getExtent();
    }

    // Show WKT geometry
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

            const wktLayer = new ol.layer.Vector({
                source: new ol.source.Vector({
                    features: [wktFeature]
                }),
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: 'red',
                        width: 5
                    })
                })
            });
            map.addLayer(wktLayer);

            const wktExtent = wktLayer.getSource().getExtent();
            kmlExtent = kmlExtent ? ol.extent.extend(kmlExtent, wktExtent) : wktExtent;
        }
    }

    const zoomLevel = calculateZoomLevelNew(kmlExtent);
    if (kmlExtent) {
        map.getView().fit(kmlExtent, {
            duration: 1000,
            size: map.getSize(),
            maxZoom: zoomLevel
        });
    }

    legendarrayNew();
}
