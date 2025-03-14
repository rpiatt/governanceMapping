import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import FreehandMode from 'mapbox-gl-draw-freehand-mode';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';


// Fix MapboxDraw classes for MapLibre
MapboxDraw.constants.classes.CONTROL_BASE  = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP  = 'maplibregl-ctrl-group';

const Draw = new MapboxDraw({
    modes: Object.assign(MapboxDraw.modes, {
        draw_polygon: FreehandMode
    })
});

// Initialize map
const map = new maplibregl.Map({
    container: 'map',
    style: {
        version: 8,
        sources: {},
        layers: [{
            id: 'background',
            type: 'background',
            paint: {'background-color': '#f8f4f0'}
        }]
    },
    center: [-93, 44],
    zoom: 5
});

// When the map is loaded, add your sources and layers, then add the draw control:
map.on('load', function () {

    map.addSource('esri-imagery', {
        type: 'raster',
        tiles: [
            'https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        ],
        tileSize: 256
    });

    map.addSource('streams', {
        type: 'vector',
        tiles: ['https://martin-serv-dev-247449275512.us-central1.run.app/streams/{z}/{x}/{y}'],
    });

    map.addSource('waterbodies', {
        type: 'vector',
        tiles: ['https://martin-serv-dev-247449275512.us-central1.run.app/waterbodies/{z}/{x}/{y}'],
    });

    map.addSource('pad', {
        type: 'vector',
        tiles: ['https://martin-serv-dev-247449275512.us-central1.run.app/pad/{z}/{x}/{y}'],
    });

    map.addSource('ct', {
        type: 'vector',
        tiles: ['https://martin-serv-dev-247449275512.us-central1.run.app/ct/{z}/{x}/{y}'],
    });

    map.addLayer({
        id: 'esri-imagery-layer',
        type: 'raster',
        source: 'esri-imagery',
    });

    map.addLayer({
        id: 'streams-layer',
        type: 'line',
        source: 'streams',
        'source-layer': 'streams',
        paint: {
            'line-color': '#0000ff'
        },
    });

    map.addLayer({
        id: 'waterbodies-layer',
        type: 'fill',
        source: 'waterbodies',
        'source-layer': 'waterbodies',
        paint: {
            'fill-color': '#0000ff'
        },
    });

    map.addLayer({
        id: 'pad-layer',
        type: 'fill',
        source: 'pad',
        'source-layer': 'pad',
        paint: {
            'fill-color': [
                'match',
                ['get', 'Mang_Type'],
                'DIST', '#fff723',
                'FED', '#00FF00',
                'JNT', '#fff723',
                'LOC', '#fff723',
                'NGO', '#36FFCE',
                'PVT', '#36FFCE',
                'STAT', '#eb8f43',
                'TRIB', '#870204',
                'UNK', '#CCCCCC',
                '#CCCCCC'
            ]
        },
    });

    map.addLayer({
        id:'ceded-territories-layer',
        type: 'line',
        source: 'ct',
        'source-layer': 'cededTerritory',
        paint: {
            'line-color': '#000000',
            'line-width': 3
        }
    });

    map.addControl(Draw);

});

map.on('click', 'pad-layer', function (e) {
    const features = map.queryRenderedFeatures(e.point, {
        layers: ['pad-layer']
    });
    if (!features.length) {
        return;
    }
    const feature = features[0];
    let popupContent = '<h3>Pad Details</h3>';
    for (const key in feature.properties) {
        popupContent += `<strong>${key}:</strong> ${feature.properties[key]}<br>`;
    }
    new maplibregl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(popupContent)
        .addTo(map);
});



//utilities
function setLayerVisibility(layerId, visible) {
    map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none');
}

document.getElementById('togglePad').addEventListener('change', function(e) {
  setLayerVisibility('pad-layer', this.checked);
});

document.getElementById('padOpacity').addEventListener('input', function(e) {
  map.setPaintProperty('pad-layer', 'fill-opacity', parseFloat(this.value));
});

document.getElementById('toggleWaterBodies').addEventListener('change', function(e) {
  setLayerVisibility('waterbodies-layer', this.checked);
});

document.getElementById('waterBodiesOpacity').addEventListener('input', function(e) {
  map.setPaintProperty('waterbodies-layer', 'fill-opacity', parseFloat(this.value));
});

document.getElementById('toggleRiversStreams').addEventListener('change', function(e) {
  setLayerVisibility('streams-layer', this.checked);
});

document.getElementById('riversStreamsOpacity').addEventListener('input', function(e) {
  map.setPaintProperty('streams-layer', 'line-opacity', parseFloat(this.value));
});

document.getElementById('toggleCededTerritories').addEventListener('change', function(e) {
  setLayerVisibility('ceded-territories-layer', this.checked);
});
