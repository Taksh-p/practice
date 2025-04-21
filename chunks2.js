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
            if (geometry instanceof ol.geom.LineString || geometry instanceof ol.geom.MultiLineString) {
                totalLength += geometry.getLength();
            }
        }
    }

    if (uploadedFeatures && uploadedFeatures.length > 0) {
        uploadedFeatures.forEach(feature => {
            let geometry = feature.getGeometry();
            let projectedGeometry = geometry.transform('EPSG:4326', 'EPSG:3857');
            if (projectedGeometry instanceof ol.geom.LineString || projectedGeometry instanceof ol.geom.MultiLineString) {
                totalLength += projectedGeometry.getLength();
            }
        });
    }

    // Use server-side accurate road length (optional override)
    totalLength = await findRoadLength(printwkt1);
    if (totalLength != null || totalLength != undefined) {
        $("#roadlength").html((totalLength / 1000).toFixed(2) + ' km');
    }

    // ========== WKT Chunking Helper ==========
    function chunkWKT(wktString, maxChunkSize = 1500) {
        const geometries = wktString.match(/(LINESTRING|POLYGON)\s*\([^\)]*\)/g);
        if (!geometries) return [];

        let chunks = [];
        let currentChunk = '';

        for (const geom of geometries) {
            if ((currentChunk + ' ' + geom).length > maxChunkSize) {
                chunks.push(currentChunk.trim());
                currentChunk = geom;
            } else {
                currentChunk += ' ' + geom;
            }
        }
        if (currentChunk.trim() !== '') chunks.push(currentChunk.trim());

        return chunks;
    }

    const interChunks = chunkWKT(printwkt1, 1500);  // Adjust size based on URL limits

    // ========== Load Base Layers ==========
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

    const land_data = JSON.parse($("#landTable").val());
    layers_inter.push(...land_data);

    // ========== Apply INTERSECTS filters in chunks ==========
    for (const layerName of layers_inter) {
        for (const chunk of interChunks) {
            let interLayerFilter = `INTERSECTS(geom,${chunk})`;
            map.addLayer(new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: contextPath + mapwmsurl71,
                    crossOrigin: 'anonymous',
                    params: {
                        'LAYERS': layerName,
                        version: '1.1.1',
                        format_options: 'dpi:110',
                        CQL_FILTER: interLayerFilter,
                        STYLES: inter_style ? inter_style[layers_inter.indexOf(layerName)] : ''
                    }
                }),
                showLegend: true
            }));
        }
    }

    // ========== Apply DWITHIN filters in chunks ==========
    for (const layerName of layers_dwith) {
        for (const chunk of interChunks) {
            let dwithLayerFilter = `DWITHIN(geom,${chunk},1, kilometers)`;
            map.addLayer(new ol.layer.Tile({
                source: new ol.source.TileWMS({
                    url: contextPath + mapwmsurl71,
                    crossOrigin: 'anonymous',
                    params: {
                        'LAYERS': layerName,
                        version: '1.1.1',
                        format_options: 'dpi:110',
                        CQL_FILTER: dwithLayerFilter,
                        STYLES: dwith_style ? dwith_style[layers_dwith.indexOf(layerName)] : ''
                    }
                }),
                showLegend: true
            }));
        }
    }

    // ========== Add Print Polygon ==========
    if (typeof polygone_printmp !== "undefined") {
        const feature = new ol.format.WKT().readFeature(polygone_printmp, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        const vectorLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: [feature] }),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({ color: 'blue', width: 2 })
            })
        });
        map.addLayer(vectorLayer);
    }

    // ========== Add Uploaded Features ==========
    let kmlExtent;
    if (uploadedFeatures && uploadedFeatures.length > 0) {
        const kmlLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: uploadedFeatures }),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({ color: 'red', width: 5 })
            })
        });
        map.addLayer(kmlLayer);
        kmlExtent = kmlLayer.getSource().getExtent();
    }

    // ========== Add Print WKT ==========
    if (printwkt1) {
        const wktFeature = new ol.format.WKT().readFeature(printwkt1, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
        });

        const wktLayer = new ol.layer.Vector({
            source: new ol.source.Vector({ features: [wktFeature] }),
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({ color: 'red', width: 5 })
            })
        });
        map.addLayer(wktLayer);

        const wktExtent = wktLayer.getSource().getExtent();
        kmlExtent = kmlExtent ? ol.extent.extend(kmlExtent, wktExtent) : wktExtent;
    }

    if (kmlExtent) {
        const zoomLevel = calculateZoomLevelNew(kmlExtent);
        map.getView().fit(kmlExtent, { duration: 1000, size: map.getSize(), maxZoom: zoomLevel });
    }

    legendarrayNew();
}
