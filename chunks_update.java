@PostMapping("/intersect-layers")
public ResponseEntity<Map<String, Object>> intersectLayers(@RequestBody GeometryRequest request) {
    String wkt = request.getWkt();
    double bufferDistance = 1.0; // for DWITHIN (in km)
    
    List<String> interLayers = request.getInterLayers();
    List<String> dwithLayers = request.getDwithLayers();

    Map<String, Object> result = new HashMap<>();

    for (String layer : interLayers) {
        List<GeoJSONFeature> features = geoService.getIntersectingFeatures(layer, wkt);
        result.put(layer + "_intersects", features);
    }

    for (String layer : dwithLayers) {
        List<GeoJSONFeature> features = geoService.getDwithinFeatures(layer, wkt, bufferDistance);
        result.put(layer + "_dwithin", features);
    }

    return ResponseEntity.ok(result);
}





public List<GeoJSONFeature> getIntersectingFeatures(String tableName, String wkt) {
    String sql = "SELECT *, ST_AsGeoJSON(geom) as geojson FROM " + tableName +
                 " WHERE ST_Intersects(geom, ST_GeomFromText(?, 4326))";

    return jdbcTemplate.query(sql, new Object[]{wkt}, (rs, rowNum) -> {
        return new GeoJSONFeature(rs.getString("geojson"));
    });
}

public List<GeoJSONFeature> getDwithinFeatures(String tableName, String wkt, double distanceKm) {
    String sql = "SELECT *, ST_AsGeoJSON(geom) as geojson FROM " + tableName +
                 " WHERE ST_DWithin(geom::geography, ST_GeomFromText(?, 4326)::geography, ?)";

    return jdbcTemplate.query(sql, new Object[]{wkt, distanceKm * 1000}, (rs, rowNum) -> {
        return new GeoJSONFeature(rs.getString("geojson"));
    });
}





async function fetchAndDrawFilteredFeatures(printwkt1, interLayers, dwithLayers) {
    const response = await fetch(contextPath + "/intersect-layers", {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            wkt: printwkt1,
            interLayers,
            dwithLayers
        })
    });

    const data = await response.json();

    Object.entries(data).forEach(([layerKey, features]) => {
        let vectorSource = new ol.source.Vector({
            features: features.map(f => new ol.format.GeoJSON().readFeature(f))
        });

        let vectorLayer = new ol.layer.Vector({
            source: vectorSource,
            style: new ol.style.Style({
                stroke: new ol.style.Stroke({ color: 'orange', width: 3 })
            })
        });

        map.addLayer(vectorLayer);
    });
}
