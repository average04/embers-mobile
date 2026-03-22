/**
 * Builds a self-contained Leaflet HTML string for use in a react-native-webview.
 * @param lat  Initial center latitude
 * @param lng  Initial center longitude
 * @param zoom Initial zoom level
 */
export function buildMapHtml(lat: number, lng: number, zoom: number): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
<link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css" />
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
<script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body, #map { width: 100vw; height: 100vh; background: #0f1117; }
</style>
</head>
<body>
<div id="map"></div>
<script>
  var map = L.map('map', {
    zoomControl: false,
    attributionControl: false,
    worldCopyJump: true,
    maxBounds: [[-90, -180], [90, 180]],
    maxBoundsViscosity: 1.0,
  }).setView([${lat}, ${lng}], ${zoom});

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    maxZoom: 19,
  }).addTo(map);

  var markers = L.markerClusterGroup({ maxClusterRadius: 40 });
  map.addLayer(markers);

  function orangeIcon() {
    return L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;border-radius:50%;background:#f97316;border:2px solid #fff;"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  function blueIcon() {
    return L.divIcon({
      className: '',
      html: '<div style="width:14px;height:14px;border-radius:50%;background:#60a5fa;border:2px solid #fff;"></div>',
      iconSize: [14, 14],
      iconAnchor: [7, 7],
    });
  }

  function postToRN(obj) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    }
  }

  var initialCenterDone = false;

  function updateEmbers(embers, location) {
    markers.clearLayers();

    embers.forEach(function(e) {
      var icon = e.kind === 'orange' ? orangeIcon() : blueIcon();
      var m = L.marker([e.lat, e.lng], { icon: icon });
      m.on('click', function() {
        postToRN({ type: 'MARKER_TAP', id: e.id, kind: e.kind });
      });
      markers.addLayer(m);
    });

    if (location && !initialCenterDone) {
      map.setView([location.lat, location.lng], 13, { animate: true });
      initialCenterDone = true;
    }
  }

  function handleMessage(event) {
    try {
      var msg = JSON.parse(event.data);
      if (msg.type === 'UPDATE_EMBERS') {
        updateEmbers(msg.embers || [], msg.location || null);
      } else if (msg.type === 'JUMP_TO') {
        map.setView([msg.lat, msg.lng], msg.zoom || 13, { animate: true });
      }
    } catch (e) {}
  }

  window.addEventListener('message', handleMessage);
  document.addEventListener('message', handleMessage);

  map.on('moveend', function() {
    var b = map.getBounds();
    postToRN({
      type: 'REGION_CHANGE',
      south: b.getSouth(),
      north: b.getNorth(),
      west: b.getWest(),
      east: b.getEast(),
      zoom: map.getZoom(),
    });
  });

  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    postToRN({ type: 'MAP_READY' });
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      postToRN({ type: 'MAP_READY' });
    });
  }
</script>
</body>
</html>`
}
