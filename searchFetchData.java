@GetMapping("/fetchRoadData")
public ResponseEntity<Map<String, Object>> fetchRoadData(
        @RequestParam String cqlFilter,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "10") int size,
        @RequestParam(value = "search[value]", required = false) String searchValue) {

    cqlFilter = decode(cqlFilter);
    String filterRoadAccordingCqlQuery;

    // List of all columns you want to search
    List<String> searchableColumns = Arrays.asList(
            "road_name_english", "contractor_name", "district_name_english", "district_name_hindi", "scheme",
            "road_category", "surface_pwd", "total_road_length", "category_name", "circle_id", "division_name",
            "financial_progress", "importance_name", "work_order_date" // Add more columns as needed
    );

    // Build WHERE clause
    String whereClause = "";

    // Check for any base filters
    if (!Strings.isNullOrEmpty(cqlFilter)) {
        whereClause = " WHERE " + cqlFilter;
    }

    // Apply search filter if provided
    if (searchValue != null && !searchValue.trim().isEmpty()) {
        String search = searchValue.trim().toLowerCase();

        // Build the search query for all columns
        StringBuilder searchClause = new StringBuilder();
        for (String column : searchableColumns) {
            if (searchClause.length() > 0) {
                searchClause.append(" OR ");
            }
            searchClause.append("LOWER(").append(column).append(") LIKE '%").append(search).append("%'");
        }

        // Add to WHERE clause
        if (whereClause.isEmpty()) {
            whereClause = " WHERE " + searchClause.toString();
        } else {
            whereClause += " AND " + searchClause.toString();
        }
    }

    // The main query to fetch filtered records
    String query = "SELECT * FROM mppwd_road" + whereClause + " LIMIT ? OFFSET ?";
    List<Map<String, Object>> results = template2.queryForList(query, size, page * size);

    // Query to count total records after applying the filter
    String countQuery = "SELECT COUNT(*) FROM mppwd_road" + whereClause;
    int totalCount = template2.queryForObject(countQuery, Integer.class);

    // Return the filtered data
    Map<String, Object> response = new HashMap<>();
    response.put("data", results);
    response.put("recordsTotal", totalCount); // Total records before search
    response.put("recordsFiltered", totalCount); // Total after filtering

    return ResponseEntity.ok(response);
}
