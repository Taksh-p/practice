document.addEventListener("DOMContentLoaded", function () {
    const districtDropdown = document.getElementById("districtDropdown");
    const layerDropdowns = {
        layerDropdown1: document.getElementById("layerDropdown1"),
        layerDropdown2: document.getElementById("layerDropdown2"),
        layerDropdown3: document.getElementById("layerDropdown3")
    };

    let districtCode = null;  // Stores selected district ID
    let selectedLayers = {};  // Stores selected layers per dropdown
    let map, districtLayer, overlayLayers = {};

    // Initialize Map
    function initMap() {
        map = new ol.Map({
            target: 'map',
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.OSM()
                })
            ],
            view: new ol.View({
                center: ol.proj.fromLonLat([78.6569, 23.1815]), // Madhya Pradesh Center
                zoom: 6
            })
        });

        loadDistrictBoundary();
    }

    // Load Madhya Pradesh boundary on map load
    function loadDistrictBoundary() {
        districtLayer = new ol.layer.Image({
            source: new ol.source.ImageWMS({
                url: 'http://localhost:8080/geoserver/wms',
                params: { 'LAYERS': 'district_boundry_2023', 'CQL_FILTER': "stcode11='23'" },
                serverType: 'geoserver'
            })
        });
        map.addLayer(districtLayer);
    }

    // Fetch districts from backend
    function loadDistricts() {
        fetch('/districts')
            .then(response => response.json())
            .then(data => {
                data.forEach(district => {
                    let option = document.createElement("option");
                    option.value = district.dtcode11;
                    option.textContent = district.dtname;
                    districtDropdown.appendChild(option);
                });
            })
            .catch(error => console.error("Error loading districts:", error));
    }

    // When user selects a district
    districtDropdown.addEventListener("change", function () {
        districtCode = this.value;
        updateMap();
    });

    // When user selects a layer
    Object.entries(layerDropdowns).forEach(([key, dropdown]) => {
        dropdown.addEventListener("change", function () {
            selectedLayers[key] = this.value;
            updateMap();
        });
    });

    // Function to update the map based on selected district and layers
    function updateMap() {
        // Apply CQL Filter for District if selected
        let cqlFilter = districtCode ? `dtcode11='${districtCode}'` : null;

        // Remove previous layers
        Object.values(overlayLayers).forEach(layer => {
            map.removeLayer(layer);
        });

        // Add selected layers
        Object.entries(selectedLayers).forEach(([key, layerName]) => {
            if (layerName) {
                overlayLayers[key] = new ol.layer.Image({
                    source: new ol.source.ImageWMS({
                        url: 'http://localhost:8080/geoserver/wms',
                        params: {
                            'LAYERS': layerName,
                            'CQL_FILTER': cqlFilter
                        },
                        serverType: 'geoserver'
                    })
                });
                map.addLayer(overlayLayers[key]);
            }
        });
    }

    // Initialize
    initMap();
    loadDistricts();
});
