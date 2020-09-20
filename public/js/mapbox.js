/* eslint-disable */
const locations = JSON.parse(document.getElementById('map').dataset.locations);
// console.log(locations);

mapboxgl.accessToken =
  'pk.eyJ1IjoieGlhb3pob3VjdWkiLCJhIjoiY2tmYWVjZnQ1MGNyYTJ1cWpocXc2cjlxZCJ9.KpVXF3EzwMPtVPULPwlHqQ';

var map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/xiaozhoucui/ckfag2jsq3cxz19t9ay9inkkm',
  // scrollZoom: false,
  // center: [-118.113491, 34.111745],
  // zoom: 10,
  // interactive: false,
});

const bounds = new mapboxgl.LngLatBounds();

locations.forEach(loc => {
  // Create marker
  const el = document.createElement('div');
  el.className = 'marker';

  // Add marker
  new mapboxgl.Marker({
    elemen: el,
    anchor: 'bottom',
  })
    .setLngLat(loc.coordinates)
    .addTo(map);

  // Add popup
  new mapboxgl.Popup({
    offset: 60
  })
    .setLngLat(loc.coordinates)
    .setHTML(`<p>Day ${loc.day}: ${loc.description}</p>`)
    .addTo(map);

  // Extend map bounds to include current location
  bounds.extend(loc.coordinates);
});

map.fitBounds(bounds, {
  padding: {
    top: 200,
    bottom: 200,
    left: 200,
    right: 200,
  },
});
// script((src = 'https://api.mapbox.com/mapbox-gl-js/v1.12.0/mapbox-gl.js'));
