async function fetchBoundary(sid, disidArray) {
    const disidString = disidArray.join(",");
    const url = `/fetchDistrictExtend?stateCode=${sid}&districtCodes=${disidString}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data && data.geom) {
            return JSON.parse(data.geom);  // Convert GeoJSON string to object
        } else {
            throw new Error("No boundary data found.");
        }
    } catch (error) {
        console.error("Error fetching boundary:", error);
        return null;
    }
}

// Validate Line Using GeoJSON Boundaries
async function validateLine(sid, disidArray, lineString) {
    const boundaryGeoJSON = await fetchBoundary(sid, disidArray);

    if (!boundaryGeoJSON) {
        Swal.fire("Error fetching boundary data.");
        return;
    }

    const isContained = turf.booleanWithin(lineString, boundaryGeoJSON);

    if (isContained) {
        console.log("Valid Line within district boundary.");
    } else {
        Swal.fire("Invalid line. Please draw within your assigned districts.");
        lat_long_list = [];
        clearMapmp();
        map.un('singleclick', clickEvent);
    }
}


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

    return results.isEmpty() ? Collections.emptyMap() : results.get(0);  
}
