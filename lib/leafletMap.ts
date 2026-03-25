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

  @keyframes ember-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.15); opacity: 0.85; }
  }

  @keyframes ember-cluster-large-pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.1); opacity: 0.9; }
  }

  .ember-marker {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    animation: ember-pulse 2s ease-in-out infinite;
    position: relative;
    cursor: pointer;
  }

  .ember-marker-orange {
    background: radial-gradient(circle, rgba(255,140,50,0.9) 0%, rgba(255,80,20,0.6) 50%, transparent 70%);
    box-shadow:
      0 0 10px rgba(255,100,30,0.8),
      0 0 20px rgba(255,80,20,0.6),
      0 0 30px rgba(255,60,10,0.4);
  }

  .ember-marker-orange::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 8px; height: 8px;
    border-radius: 50%;
    background: rgba(255,220,180,0.95);
    box-shadow: 0 0 6px rgba(255,255,200,0.9);
  }

  .ember-marker-blue {
    background: radial-gradient(circle, rgba(96,165,250,0.9) 0%, rgba(59,130,246,0.6) 50%, transparent 70%);
    box-shadow:
      0 0 10px rgba(59,130,246,0.8),
      0 0 20px rgba(59,130,246,0.5),
      0 0 30px rgba(59,130,246,0.3);
  }

  .ember-marker-blue::after {
    content: '';
    position: absolute;
    top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    width: 8px; height: 8px;
    border-radius: 50%;
    background: rgba(200,220,255,0.95);
    box-shadow: 0 0 6px rgba(150,200,255,0.9);
  }

  /* Orange clusters */
  .ember-cluster-sm {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,140,50,0.92) 0%, rgba(255,80,20,0.65) 60%, transparent 80%);
    box-shadow:
      0 0 10px rgba(255,100,30,0.85),
      0 0 22px rgba(255,80,20,0.55),
      0 0 36px rgba(255,60,10,0.3);
    animation: ember-pulse 2s ease-in-out infinite;
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,240,220,0.95); font-size: 13px; font-weight: 600;
    text-shadow: 0 0 6px rgba(255,160,60,0.9);
    cursor: pointer;
  }

  .ember-cluster-md {
    width: 46px; height: 46px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,150,50,0.95) 0%, rgba(255,90,20,0.75) 55%, transparent 78%);
    box-shadow:
      0 0 16px rgba(255,110,30,0.95),
      0 0 32px rgba(255,80,20,0.7),
      0 0 52px rgba(255,60,10,0.45),
      0 0 70px rgba(255,40,0,0.2);
    animation: ember-pulse 2s ease-in-out infinite;
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,240,220,0.95); font-size: 14px; font-weight: 600;
    text-shadow: 0 0 6px rgba(255,160,60,0.9);
    cursor: pointer;
  }

  .ember-cluster-lg {
    width: 58px; height: 58px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,170,60,0.98) 0%, rgba(255,110,20,0.85) 45%, rgba(255,70,10,0.55) 68%, transparent 82%);
    box-shadow:
      0 0 22px rgba(255,130,30,1),
      0 0 44px rgba(255,90,20,0.8),
      0 0 70px rgba(255,60,10,0.6),
      0 0 100px rgba(255,40,0,0.35),
      0 0 130px rgba(255,20,0,0.15);
    animation: ember-cluster-large-pulse 1.5s ease-in-out infinite;
    display: flex; align-items: center; justify-content: center;
    color: rgba(255,240,220,0.95); font-size: 16px; font-weight: 700;
    text-shadow: 0 0 6px rgba(255,160,60,0.9);
    cursor: pointer;
  }

  /* Blue clusters */
  .blue-cluster-sm {
    width: 36px; height: 36px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(96,165,250,0.92) 0%, rgba(59,130,246,0.65) 60%, transparent 80%);
    box-shadow:
      0 0 10px rgba(59,130,246,0.85),
      0 0 22px rgba(59,130,246,0.55),
      0 0 36px rgba(59,130,246,0.3);
    animation: ember-pulse 2s ease-in-out infinite;
    display: flex; align-items: center; justify-content: center;
    color: rgba(219,234,254,0.95); font-size: 13px; font-weight: 600;
    text-shadow: 0 0 6px rgba(147,197,253,0.9);
    cursor: pointer;
  }

  .blue-cluster-md {
    width: 46px; height: 46px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(147,197,253,0.95) 0%, rgba(96,165,250,0.75) 55%, transparent 78%);
    box-shadow:
      0 0 16px rgba(96,165,250,0.95),
      0 0 32px rgba(59,130,246,0.7),
      0 0 52px rgba(59,130,246,0.45),
      0 0 70px rgba(37,99,235,0.2);
    animation: ember-pulse 2s ease-in-out infinite;
    display: flex; align-items: center; justify-content: center;
    color: rgba(219,234,254,0.95); font-size: 14px; font-weight: 600;
    text-shadow: 0 0 6px rgba(147,197,253,0.9);
    cursor: pointer;
  }

  .blue-cluster-lg {
    width: 58px; height: 58px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(191,219,254,0.98) 0%, rgba(147,197,253,0.85) 45%, rgba(96,165,250,0.55) 68%, transparent 82%);
    box-shadow:
      0 0 22px rgba(147,197,253,1),
      0 0 44px rgba(96,165,250,0.8),
      0 0 70px rgba(59,130,246,0.6),
      0 0 100px rgba(37,99,235,0.35),
      0 0 130px rgba(29,78,216,0.15);
    animation: ember-cluster-large-pulse 1.5s ease-in-out infinite;
    display: flex; align-items: center; justify-content: center;
    color: rgba(219,234,254,0.95); font-size: 16px; font-weight: 700;
    text-shadow: 0 0 6px rgba(147,197,253,0.9);
    cursor: pointer;
  }
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

  function fmt(n) {
    if (n < 1000) return String(n);
    if (n < 1000000) {
      var k = n / 1000;
      return (k % 1 === 0 ? k.toFixed(0) : parseFloat(k.toFixed(1))) + 'k';
    }
    var m = n / 1000000;
    return (m % 1 === 0 ? m.toFixed(0) : parseFloat(m.toFixed(1))) + 'm';
  }

  function makeClusterGroup(prefix) {
    return L.markerClusterGroup({
      maxClusterRadius: 80,
      showCoverageOnHover: false,
      animateAddingMarkers: false,
      iconCreateFunction: function(cluster) {
        var count = cluster.getChildCount();
        var cls, size;
        if (count < 10) { cls = prefix + '-cluster-sm'; size = 36; }
        else if (count < 50) { cls = prefix + '-cluster-md'; size = 46; }
        else { cls = prefix + '-cluster-lg'; size = 58; }
        return L.divIcon({
          className: '',
          html: '<div class="' + cls + '">' + fmt(count) + '</div>',
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        });
      },
    });
  }

  var orangeMarkers = makeClusterGroup('ember');
  var blueMarkers = makeClusterGroup('blue');
  map.addLayer(orangeMarkers);
  map.addLayer(blueMarkers);

  function orangeIcon() {
    return L.divIcon({
      className: '',
      html: '<div class="ember-marker ember-marker-orange"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  function blueIcon() {
    return L.divIcon({
      className: '',
      html: '<div class="ember-marker ember-marker-blue"></div>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
  }

  function postToRN(obj) {
    if (window.ReactNativeWebView) {
      window.ReactNativeWebView.postMessage(JSON.stringify(obj));
    }
  }

  var initialCenterDone = false;

  function updateEmbers(embers, location) {
    orangeMarkers.clearLayers();
    blueMarkers.clearLayers();

    embers.forEach(function(e) {
      var icon = e.kind === 'orange' ? orangeIcon() : blueIcon();
      var m = L.marker([e.lat, e.lng], { icon: icon });
      m.on('click', function() {
        postToRN({ type: 'MARKER_TAP', id: e.id, kind: e.kind });
      });
      if (e.kind === 'orange') { orangeMarkers.addLayer(m); }
      else { blueMarkers.addLayer(m); }
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
      } else if (msg.type === 'FLY_TO') {
        map.flyTo([msg.lat, msg.lng], msg.zoom || 15, { animate: true, duration: 1.2 });
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
