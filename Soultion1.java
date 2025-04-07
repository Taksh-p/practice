@RequestMapping(value = "/fetchDistrictExtend", method = RequestMethod.GET)
@ResponseBody
public Map<String, Object> fetchDistrictExtend(@RequestParam String stateCode, @RequestParam String districtCodes) {
    String query;
    List<Map<String, Object>> results = new ArrayList<>();
    
    if (!stateCode.isEmpty() && "0".equals(districtCodes)) {
        query = "SELECT ST_AsGeoJSON(geom) as geom FROM state WHERE stateCode = '23'";
    } else {
        query = "SELECT ST_AsGeoJSON(ST_Union(geom)) as geom FROM district WHERE dtcode IN (" + districtCodes + ")";
    }
    
    results = templte.queryForList(query);
    
    if (!results.isEmpty()) {
        return results.get(0);  // Return the GeoJSON boundary
    }
    
    return Collections.emptyMap();
}
