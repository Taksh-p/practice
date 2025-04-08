draw.on('drawend', (e) => {
    map.removeInteraction(draw);
    map.removeOverlay(helpTooltip);

    measureTooltipElement.className = 'ol-tooltip ol-tooltip-static';
    measureTooltip.setOffset([0, -7]);

    sketch = null;
    measureTooltipElement = null;
    createMeasureTooltip();
    ol.Observable.unByKey(listener);

    let feature = e.feature;
    let featureClone = feature.clone();
    featureClone.getGeometry().transform('EPSG:3857', 'EPSG:4326');

    modifiedWKT = wkt_format.writeFeature(featureClone);

    // Ensure WKT is properly set
    $('#linewktmp').val(modifiedWKT);

    map.addLayer(vectorDraw);
    $('#actualDistanceedukvEDU').removeAttr('disabled');

    let area = getLengthOrArea(feature);
    let cords = Addpolygongeometryaddgeom(feature);

    addGeomwkt(cords, modifiedWKT, area, feature);

    const feat = new ol.Feature({
        geometry: e.target
    });

    getLengthOrArea(feat);
});


function generaterow_pythonmp(val) {
    rowarray = [];

    var rowleft = document.getElementById('odrangeonleftmp').value.trim();
    var rowright = document.getElementById('odrangeonrightmp').value.trim();
    var wktValue = $('#linewktmp').val(); // Ensure WKT is retrieved

    if (val == "true") {
        if (rowleft === '' || rowright === '') {
            swal.fire("Please Write Row First..!!");
            document.getElementById('odrangeonleftmp').focus();
            return;
        }

        if (!wktValue) {
            swal.fire("Invalid WKT. Please draw again.");
            return;
        }

        var left_buffer = $("#odrangeonleftmp").val();
        var right_buffer = $("#odrangeonrightmp").val();
        map.removeLayer(vectorLayerSlope_row);
        var csvalue = document.getElementById('tcn').value;

        $.ajax({
            url: "row_linegenerate?_csrf=" + csvalue,
            method: "POST",
            data: {
                "wkt": wktValue, // Pass WKT correctly
                "left_buffer": left_buffer,
                "right_buffer": right_buffer,
            },
            beforeSend: function() {
                showLoader();
            },
            success: function(response) {
                if (response.hasOwnProperty('error') || response.data.length == 0) {
                    hideLoader();
                    Swal.fire(JSON.stringify(response.message));
                } else {
                    processRowResponse(response);
                }
            },
            complete: function() {
                hideLoader();
            },
            error: function(request, status, error) {
                Swal.fire("Something went wrong. Please try again.");
            }
        });
    } else {
        map.removeLayer(vectorLayerSlope_row);
        document.getElementById('odrangeonleftmp').value = '';
        document.getElementById('odrangeonrightmp').value = '';
    }
}
