features.push({
    type: "Feature",
    geometry: parsedFeature,
    properties: {}
});


const geometries = geojsonData.map(item => JSON.parse(item.st_asgeojson));
const combinedGeometry = {
    type: "MultiPolygon",
    coordinates: geometries.map(g => g.coordinates)
};
features.push({
    type: "Feature",
    geometry: combinedGeometry,
    properties: {}
});




///////////////////



if (layerss.postrenderHandler) {
    layerss.un("postrender", layerss.postrenderHandler);
}


layerss.postrenderHandler = function (e) {
    const vectorContext = ol.render.getVectorContext(e);
    if (!vectorContext) return;

    e.context.save(); // Save context state
    e.context.globalCompositeOperation = "destination-in";

    clipLayer.getSource().forEachFeature(function (feature) {
        vectorContext.drawFeature(feature, style);
    });

    e.context.restore(); // Restore context state
};

layerss.on("postrender", layerss.postrenderHandler);
