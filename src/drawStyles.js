export const drawStyles = [
    // Line style for all features
    {
        'id': 'gl-draw-line',
        'type': 'line',
        'filter': ['all', ['==', '$type', 'LineString']],
        'paint': {
            'line-color': '#438EE4',
            'line-width': 2,
            'line-opacity': 0.8
        }
    },
    // Polygon fill style
    {
        'id': 'gl-draw-polygon-fill',
        'type': 'fill',
        'filter': ['all', ['==', '$type', 'Polygon']],
        'paint': {
            'fill-color': '#438EE4',
            'fill-outline-color': '#438EE4',
            'fill-opacity': 0.3
        }
    },
    // Polygon outline style
    // {
    //     'id': 'gl-draw-polygon-stroke',
    //     'type': 'line',
    //     'filter': ['all', ['==', '$type', 'Polygon']],
    //     'paint': {
    //         'line-color': '#438EE4',
    //         'line-width': 2,
    //         'line-opacity': 0.8
    //     }
    // },
    // Point style
    {
        'id': 'gl-draw-point',
        'type': 'circle',
        'filter': ['all', ['==', '$type', 'Point']],
        'paint': {
            'circle-radius': 6,
            'circle-color': '#438EE4',
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.8
        }
    }
]; 