@PostMapping(path = "/getboundryextent")
public @ResponseBody List<Map<String, Object>> getboundryextent(@RequestBody Map<String, Object> request) {
    List<Map<String, Object>> projectdata = new ArrayList<>();
    
    String sid = decode((String) request.get("sid"));
    List<String> disidList = (List<String>) request.get("disid");

    String query = "SELECT * FROM district_boundary_21_03_2023 WHERE district_c IN (%s)";

    String placeholders = String.join(",", Collections.nCopies(disidList.size(), "?"));
    query = String.format(query, placeholders);

    try {
        projectdata = template.queryForList(query, disidList.toArray());
    } catch (Exception e) {
        e.printStackTrace();
    }

    return projectdata;
}
