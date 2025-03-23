import maplibregl from 'maplibre-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import FreehandMode from 'mapbox-gl-draw-freehand-mode';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import shpwrite from '@mapbox/shp-write';
import { drawStyles } from './drawStyles';

//console.log('Draw styles:', drawStyles); // Debug log

// Fix MapboxDraw classes for MapLibre
MapboxDraw.constants.classes.CONTROL_BASE  = 'maplibregl-ctrl';
MapboxDraw.constants.classes.CONTROL_PREFIX = 'maplibregl-ctrl-';
MapboxDraw.constants.classes.CONTROL_GROUP  = 'maplibregl-ctrl-group';

const Draw = new MapboxDraw({
    modes: Object.assign(MapboxDraw.modes, {
        draw_polygon: FreehandMode
    }),
    styles: drawStyles
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

const featuresWithAttributes = [];

const exportButton = document.createElement("button");
exportButton.innerText = "Export to Shapefile";
exportButton.style.position = 'absolute';
exportButton.style.top = '18px';
exportButton.style.right = '60px';
exportButton.style.zIndex = '10000';
exportButton.onclick = exportToShapefile;
document.body.appendChild(exportButton);

map.on('draw.modechange', (e) => {
    if (e.mode === 'simple_select') {
        map.dragPan.enable(); // Re-enable panning when not drawing
    } else {
        map.dragPan.disable(); // Disable panning when drawing
    }
});

map.on('draw.create', (e) => {
    const feature = e.features[0];

    document.getElementById('attributeForm').style.display = 'block';

    document.getElementById('saveAttributes').onclick = function () {
        const name = document.getElementById('name').value;
        const description = document.getElementById('description').value;

        feature.properties = {
            name: name,
            description: description
        };

        document.getElementById('attributeForm').style.display = 'none';

        featuresWithAttributes.push(feature);
    };
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

function base64ToArrayBuffer(base64) {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
}

async function exportToShapefile() {
    const data = Draw.getAll();
    console.log("Drawn Features:", JSON.stringify(data, null, 2)); //log features to console on export attempt

    if (data.features.length === 0) {
        alert('No features to export');
        return;
    }
    // const options = {
    //     folder: 'drawnFeatures',
    //     types: {
    //         polygon: 'polygon',
    //         polyline: 'line',
    //         Point: 'point'
    //     }
    // };

    try {
        //shpwrite may be returning a base64 string, so may need to rewrite var names below
        const result = await shpwrite.zip(data);
        //console.log("Shapefile ArrayBuffer:", arrayBuffer); //log shpwrite output to console
        //console.log(arrayBuffer.byteLength);
        console.log("Result type:", Object.prototype.toString.call(result));

        let arrayBuffer;
        if (typeof result === 'string') {
            arrayBuffer = base64ToArrayBuffer(result);
        } else {
            arrayBuffer = result;
        }

        if (!arrayBuffer || arrayBuffer.byteLength === 0) {
            alert("Failed to create shapefile archive.");
            return;
        }

        const uint8Array = new Uint8Array(arrayBuffer);
        console.log("Uint8Array length:", uint8Array.length);
        console.log("First few bytes of Uint8Array:", uint8Array.slice(0, 10));

        const blob = new Blob([uint8Array], { type: "application/zip" });
        //const blob = new Blob([new Uint8Array(arrayBuffer)], {type: 'application/zip'}); //breaking into parts for error checking
        console.log("Blob size:", blob.size);
        console.log("Blob type:", blob.type);

        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = 'drawnFeatures.zip';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting to shapefile:', error);
        alert('Failed to export to shapefile.');
    }
}