/* Branch locations and external websites are managed in branches.json. */
(async function initBranchMap() {
    const container = document.getElementById('branch-map');
    const select = document.getElementById('branch-select');
    const detail = document.getElementById('branch-map-detail');
    const status = document.getElementById('branch-map-status');
    const reset = document.getElementById('branch-map-reset');
    const error = document.getElementById('branch-map-error');
    const markers = new Map();
    let map;
    let branches;
    try {
        const response = await fetch('branches.json');
        if (!response.ok) throw new Error('Branch data unavailable');
        branches = await response.json();
    } catch {
        status.textContent = 'Daftar cabang belum dapat dimuat. Silakan muat ulang halaman.';
        return;
    }
    const safeWebsite = branch => {
        if (!branch.website) return null;
        try {
            const url = new URL(branch.website, window.location.href);
            return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
        } catch { return null; }
    };
    function showBranch(branch, zoom = true) {
        select.value = branch.id;
        detail.replaceChildren();
        const label = document.createElement('span');
        label.textContent = branch.region.toUpperCase();
        const title = document.createElement('h4');
        title.textContent = branch.name;
        const address = document.createElement('p');
        address.textContent = branch.isPreview ? 'Titik contoh wilayah. Alamat toko akan ditampilkan setelah dikonfirmasi.' : (branch.address || 'Hubungi tim untuk informasi alamat cabang.');
        detail.append(label, title, address);
        const website = safeWebsite(branch);
        if (website) {
            const link = document.createElement('a');
            link.className = 'pill-link';
            link.href = website;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Buka website cabang ↗';
            detail.append(link);
        } else {
            const note = document.createElement('p');
            note.className = 'branch-website-pending';
            note.textContent = 'Website cabang belum tersedia.';
            detail.append(note);
        }
        if (map && zoom) map.setView(branch.coordinates, 11, { animate: !matchMedia('(prefers-reduced-motion: reduce)').matches });
        markers.forEach((marker, id) => marker.getElement()?.classList.toggle('branch-marker-selected', id === branch.id));
    }
    branches.forEach(branch => {
        const option = document.createElement('option');
        option.value = branch.id;
        option.textContent = branch.name;
        select.append(option);
        const card = document.getElementById('wilayah-' + branch.id);
        if (card) {
            const website = safeWebsite(branch);
            if (website) {
                card.href = website;
                card.setAttribute('aria-label', 'Buka website ' + branch.name);
                card.querySelector('.dummy-tag').textContent = 'Website contoh cabang ↗';
            } else {
                card.href = '#branch-map';
                card.removeAttribute('target');
                card.setAttribute('aria-label', 'Lihat ' + branch.name + ' di peta, titik contoh');
                card.querySelector('.dummy-tag').textContent = 'Lihat di peta ↗';
                card.addEventListener('click', () => showBranch(branch));
            }
        }
    });
    select.addEventListener('change', () => {
        const branch = branches.find(branch => branch.id === select.value);
        if (branch) showBranch(branch);
        else reset.click();
    });
    if (!branches.some(branch => branch.isPreview)) status.textContent = branches.length + ' cabang Raditya Bali';
    if (typeof L === 'undefined') {
        error.hidden = false;
        reset.disabled = true;
        return;
    }
    map = L.map(container, { scrollWheelZoom: false, zoomControl: false, maxZoom: 17, minZoom: 7 });
    L.control.zoom({ position: 'bottomright' }).addTo(map);
    const tiles = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 17
    }).addTo(map);
    let loaded = false;
    tiles.on('tileload', () => { loaded = true; error.hidden = true; });
    tiles.on('tileerror', () => { if (!loaded) error.hidden = false; });
    const baliBounds = [[-8.87, 114.42], [-8.03, 115.72]];
    function fitBali() { map.fitBounds(baliBounds, { padding: [24, 24], animate: false }); }
    branches.forEach(branch => {
        const icon = L.divIcon({ className: 'branch-marker', html: '<span><img src="image/Logo-Raditya-Putih.webp" alt=""></span>', iconSize: [40, 40], iconAnchor: [20, 20] });
        const marker = L.marker(branch.coordinates, { icon, title: branch.name + (branch.isPreview ? ' — titik contoh' : ''), alt: branch.name, keyboard: true }).addTo(map);
        const tooltip = document.createElement('span');
        tooltip.textContent = branch.name + (branch.isPreview ? ' · Contoh' : '');
        marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -22] });
        marker.on('click', () => {
            showBranch(branch, false);
            const website = safeWebsite(branch);
            if (website) window.open(website, '_blank', 'noopener,noreferrer');
        });
        markers.set(branch.id, marker);
    });
    reset.addEventListener('click', () => {
        select.value = '';
        detail.replaceChildren();
        const p = document.createElement('p');
        p.textContent = 'Pilih penanda di peta atau wilayah cabang di atas.';
        detail.append(p);
        markers.forEach(marker => marker.getElement()?.classList.remove('branch-marker-selected'));
        fitBali();
    });
    fitBali();
    new ResizeObserver(() => { map.invalidateSize(); if (!select.value) fitBali(); }).observe(container);
})();
