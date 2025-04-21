async function basiclayersNew(layers_b, printwkt1, uploadedFeatures) {
    $('#printwkt').val(printwkt1);

    // Helper: Split LINESTRING into MULTILINESTRING chunks
    function splitLineStringToMultiLineChunks(wkt, chunkSize = 20) {
        const matches = wkt.match(/LINESTRING\s*\(([^)]+)\)/i);
        if (!matches || matches.length < 2) return [];

        const coords = matches[1].split(',').map(coord => coord.trim());
        const chunks = [];

        for (let i = 0; i < coords.length - 1; i += chunkSize) {
            const subLine = coords.slice(i, i + chunkSize + 1);
            if (subLine.length > 1) {
                chunks.push(`(${subLine.join(', ')})`);
            }
        }

        return chunks.map(chunk => `MULTILINESTRING (${chunk})`);
    }

    // Length calculation
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

    // Add basic layers
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

    // INTERSECTS logic for large WKT
    let chunks = splitLineStringToMultiLineChunks(printwkt1);
    let land_data = JSON.parse($("#landTable").val());
    layers_inter.push(...land_data);

    for (let chunk of chunks) {
        let inter_layer = `INTERSECTS(geom, ${chunk})`;

        for (let i = 0; i < layers_inter.length; i++) {
            let layerParams = {
                'LAYERS': layers_inter[i],
                version: '1.1.1',
                format_options: 'dpi:110',
                CQL_FILTER: inter_layer
            };

            if (inter_style && inter_style[i]) {
                layerParams.STYLES = inter_style[i];
            }

            let distLayer = new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: contextPath + mapwmsurl71,
                    crossOrigin: 'anonymous',
                    params: layerParams
                }),
                showLegend: true
            });

            map.addLayer(distLayer);
        }
    }

    // DWITHIN logic
    let dwithin_layer = `DWITHIN(geom, ${printwkt1}, 1, kilometers)`;
    for (let i = 0; i < layers_dwith.length; i++) {
        let dwithParams = {
            'LAYERS': layers_dwith[i],
            version: '1.1.1',
            format_options: 'dpi:110',
            CQL_FILTER: dwithin_layer
        };

        if (dwith_style && dwith_style[i]) {
            dwithParams.STYLES = dwith_style[i];
        }

        let dwithLayer = new ol.layer.Tile({
            source: new ol.source.TileWMS({
                url: contextPath + mapwmsurl71,
                crossOrigin: 'anonymous',
                params: dwithParams
            }),
            showLegend: true
        });

        map.addLayer(dwithLayer);

        // Draw polygon (if provided)
        if (polygone_printmp) {
            let feature = new ol.format.WKT().readFeature(polygone_printmp, {
                dataProjection: 'EPSG:4326',
                featureProjection: 'EPSG:3857'
            });

            let vectorSource = new ol.source.Vector({ features: [feature] });
            let vectorLayer = new ol.layer.Vector({
                source: vectorSource,
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({ color: 'blue', width: 2 })
                })
            });

            map.addLayer(vectorLayer);
        }
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
