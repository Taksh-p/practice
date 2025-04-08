new ol.layer.Tile({
    visible: false,
    source: new ol.source.TileImage({
        url: 'http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}'
    }),
    zIndex: -10,  // Set this lower than vector layers
    name: 'High Resolution Image',
    declutter: true,  // Allow vector layers to render on top
});


function toggleHighResolutionImage() {
    var layerss = findlayeByName(map.getLayerGroup(), 'name', 'High Resolution Image');
    const checkbox = document.getElementById('show_hidecheckox');
    
    if (checkbox.checked) {
        layerss.setVisible(true);
        layerss.set('pointerEvents', 'none'); // Prevent it from blocking clicks
    } else {
        layerss.setVisible(false);
    }
}


vector.setZIndex(20); // Ensure it's above the satellite image
map.addLayer(vector);
