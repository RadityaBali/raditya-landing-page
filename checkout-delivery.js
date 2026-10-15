/* Fixed branch origin; the customer only chooses the delivery destination. */
let checkoutBranch = null;
let checkoutRouteController = null;
let checkoutLocationVersion = 0;
function resetCheckoutEstimate() {
    deliveryRequestVersion++;
    checkoutRouteController?.abort();
    deliveryReady = false;
    currentDistance = 0;
    currentOngkir = 0;
    if (routeLayer && mapInstance) { routeLayer.remove(); routeLayer = null; }
    document.getElementById('ongkir-container').style.display = 'none';
    if (typeof updateCashSummary === 'function') updateCashSummary();
}
function setDeliveryBranch(branch) {
    const previousId = checkoutBranch?.id;
    checkoutBranch = branch || null;
    document.getElementById('delivery-use-location').disabled = !branch;
    document.getElementById('delivery-origin-name').textContent = branch ? branch.name : 'Pilih cabang terlebih dahulu';
    document.getElementById('delivery-origin-address').textContent = branch ? (branch.address || 'Lokasi tetap cabang') + (branch.isPreview ? ' · Titik dummy' : '') : 'Titik cabang otomatis dan tidak bisa digeser.';
    if (previousId === branch?.id) return;
    resetCheckoutEstimate();
    if (originMarker) { originMarker.remove(); originMarker = null; }
    if (!branch) {
        document.getElementById('map-status').textContent = 'Pilih cabang pengiriman terlebih dahulu.';
        return;
    }
    BASE_LAT = branch.coordinates[0]; BASE_LNG = branch.coordinates[1]; selectedDeliveryRegion = branch.region;
    if (mapInstance) {
        originMarker = L.marker(branch.coordinates, { draggable: false, title: 'Cabang pengiriman: ' + branch.name }).addTo(mapInstance).bindTooltip('Cabang ' + branch.region + ' · Titik tetap', { direction: 'top' });
        if (deliveryLocationKnown) recalculateDelivery();
        else { mapInstance.setView(branch.coordinates, 12); document.getElementById('map-status').textContent = 'Klik peta atau geser pin rumah. Titik cabang tetap dan tidak bisa dipindahkan.'; }
    }
}
function initMap() {
    if (typeof L === 'undefined') { document.getElementById('map-status').textContent = 'Peta belum dapat dimuat. Silakan muat ulang halaman.'; return; }
    if (mapInstance) { mapInstance.invalidateSize(); return; }
    mapInstance = L.map('map').setView(checkoutBranch?.coordinates || [-8.45,115.15], checkoutBranch ? 12 : 9);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors', maxZoom: 18 }).addTo(mapInstance);
    if (checkoutBranch) originMarker = L.marker(checkoutBranch.coordinates, { draggable: false, title: 'Cabang pengiriman: ' + checkoutBranch.name }).addTo(mapInstance).bindTooltip('Cabang ' + checkoutBranch.region + ' · Titik tetap', { direction: 'top' });
    mapInstance.on('click', event => pickDeliveryDestination(event.latlng));
    recalculateDelivery = calculateCheckoutDelivery;
    document.getElementById('map-status').textContent = checkoutBranch ? 'Klik peta untuk memilih titik rumah. Titik cabang sudah tetap.' : 'Pilih cabang terlebih dahulu, lalu klik peta untuk memilih titik rumah.';
}
function pickDeliveryDestination(latlng) {
    if (!checkoutBranch) { document.getElementById('map-status').textContent = 'Pilih cabang pengiriman terlebih dahulu.'; return; }
    if (!Number.isFinite(latlng.lat) || !Number.isFinite(latlng.lng) || Math.abs(latlng.lat)>90 || Math.abs(latlng.lng)>180) return;
    checkoutLocationVersion++;
    deliveryDestination = [latlng.lat,latlng.lng];
    deliveryLocationKnown = true;
    if (!destMarker) {
        const icon = L.divIcon({ className: 'checkout-house-pin', html: '<span aria-hidden="true">⌂</span>', iconSize: [32,32], iconAnchor: [16,16] });
        destMarker = L.marker(deliveryDestination, { draggable: true, icon, title: 'Rumah Anda · Bisa digeser' }).addTo(mapInstance).bindTooltip('Rumah Anda · Geser untuk menyesuaikan', { direction: 'top' });
        destMarker.on('dragend', () => pickDeliveryDestination(destMarker.getLatLng()));
    } else destMarker.setLatLng(deliveryDestination);
    document.getElementById('map-status').textContent = 'Titik rumah dipilih. Menghitung pengiriman dari ' + checkoutBranch.name + '…';
    calculateCheckoutDelivery();
}
function estimateCheckoutShipping(distance) {
    // Existing illustrative website tariff, pending confirmation by branch sales.
    return Math.round(distance <= 20 ? 148000 + Math.max(0,distance-5)*9500 : 173000 + 14*8000 + (distance-20)*5500);
}
async function calculateCheckoutDelivery() {
    resetCheckoutEstimate();
    if (!checkoutBranch || !deliveryDestination || !mapInstance) return;
    const version = deliveryRequestVersion;
    const origin = [...checkoutBranch.coordinates];
    const destination = [...deliveryDestination];
    const branchName = checkoutBranch.name;
    checkoutRouteController = new AbortController();
    const controller = checkoutRouteController;
    const timeout = setTimeout(() => controller.abort(), 8000);
    let distance;
    let coordinates;
    let isRoute = false;
    try {
        const response = await fetch(`https://router.project-osrm.org/route/v1/driving/${origin[1]},${origin[0]};${destination[1]},${destination[0]}?overview=full&geometries=geojson`, { signal: controller.signal });
        if (!response.ok) throw new Error('Route unavailable');
        const data = await response.json();
        const route = data.routes?.[0];
        if (data.code !== 'Ok' || !Number.isFinite(route?.distance) || !Array.isArray(route.geometry?.coordinates)) throw new Error('Route unavailable');
        distance = route.distance/1000;
        coordinates = route.geometry.coordinates.map(coord => [coord[1],coord[0]]);
        isRoute = true;
    } catch {
        distance = branchDistance.distanceKm(origin,destination);
        coordinates = [origin,destination];
    } finally { clearTimeout(timeout); }
    if (version !== deliveryRequestVersion) return;
    currentDistance = distance;
    currentOngkir = estimateCheckoutShipping(distance);
    deliveryReady = true;
    routeLayer = L.polyline(coordinates, { color: '#289e8c', weight: 3, ...(isRoute ? {} : { dashArray: '6 8' }) }).addTo(mapInstance);
    mapInstance.fitBounds([origin,destination], { padding: [30,30], maxZoom: 15 });
    document.getElementById('ongkir-container').style.display = 'block';
    document.getElementById('jarak-display').textContent = distance.toFixed(1) + ' km' + (isRoute ? '' : ' (garis lurus)');
    document.getElementById('ongkir-display').textContent = creditFinance.rupiah(currentOngkir);
    document.getElementById('map-status').textContent = 'Dari ' + branchName + ' ke titik rumah Anda.' + (isRoute ? '' : ' Rute jalan tidak tersedia; estimasi menggunakan jarak garis lurus.');
    updateCashSummary();
}
document.getElementById('delivery-use-location').addEventListener('click', () => {
    const button = document.getElementById('delivery-use-location');
    if (!checkoutBranch) return;
    if (!navigator.geolocation || !window.isSecureContext) { document.getElementById('map-status').textContent = 'Lokasi perangkat tidak tersedia. Klik peta untuk memilih titik rumah.'; return; }
    initMap();
    const version = ++checkoutLocationVersion;
    button.disabled = true;
    document.getElementById('map-status').textContent = 'Izinkan akses lokasi, atau klik titik rumah pada peta.';
    navigator.geolocation.getCurrentPosition(position => {
        if (version === checkoutLocationVersion) pickDeliveryDestination({lat:position.coords.latitude,lng:position.coords.longitude});
        button.disabled = !checkoutBranch;
    }, () => {
        if (version === checkoutLocationVersion) document.getElementById('map-status').textContent = 'Akses lokasi belum tersedia. Klik peta untuk memilih titik rumah secara manual.';
        button.disabled = !checkoutBranch;
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 });
});
