/* Branch locations and external websites are managed in branches.json. */
(async function initBranchMap() {
    const container = document.getElementById('branch-map');
    const select = document.getElementById('branch-select');
    const detail = document.getElementById('branch-map-detail');
    const status = document.getElementById('branch-map-status');
    const reset = document.getElementById('branch-map-reset');
    const error = document.getElementById('branch-map-error');
    const markers = new Map();
    let branches;
    let userPosition;
    const locate = document.getElementById('branch-locate');
    const locationStatus = document.getElementById('branch-location-status');
    const nearestPanel = document.getElementById('branch-nearest');
    const formatDistance = distance => distance < 1 ? Math.round(distance * 1000) + ' m' : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(distance) + ' km';
    try {
        const response = await fetch('branches.json');
        if (!response.ok) throw new Error('Branch data unavailable');
        branches = await response.json();
    } catch {
        status.textContent = 'Daftar cabang belum dapat dimuat. Silakan muat ulang halaman.';
        locate.disabled = true;
        return;
    }
    const safeWebsite = branch => {
        if (!branch.website) return null;
        try {
            const url = new URL(branch.website, window.location.href);
            return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
        } catch { return null; }
    };
    function showBranch(branch) {
        detail.hidden = false;
        select.value = branch.id;
        detail.replaceChildren();
        const label = document.createElement('span');
        label.textContent = branch.region.toUpperCase();
        const title = document.createElement('h4');
        title.textContent = branch.name;
        const address = document.createElement('p');
        address.textContent = branch.isPreview ? 'Titik contoh wilayah. Alamat toko akan ditampilkan setelah dikonfirmasi.' : (branch.address || 'Hubungi tim untuk informasi alamat cabang.');
        detail.append(label, title, address);
        if (userPosition) {
            const distance = document.createElement('p');
            distance.className = 'branch-distance-label';
            distance.textContent = formatDistance(branchDistance.distanceKm(userPosition, branch.coordinates)) + ' dari lokasi Anda · Jarak garis lurus';
            detail.append(distance);
        }
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
        markers.forEach((marker, id) => {
            marker.classList.toggle('is-selected', id === branch.id);
            if (id === branch.id) marker.setAttribute('aria-current', 'location');
            else marker.removeAttribute('aria-current');
        });
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
    function setLocationStatus(message, isError = false) {
        locationStatus.hidden = false;
        locationStatus.textContent = message;
        locationStatus.classList.toggle('is-error', isError);
    }
    function displayNearest(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) {
            setLocationStatus('Lokasi belum dapat dibaca. Silakan coba lagi.', true);
            return;
        }
        userPosition = [lat, lng];
        const ranked = branchDistance.rankBranches(userPosition, branches);
        if (!ranked.length) {
            setLocationStatus('Lokasi cabang belum tersedia. Pilih cabang secara manual.', true);
            return;
        }
        const accuracy = Number.isFinite(position.coords.accuracy) ? Math.max(0, position.coords.accuracy) : 0;
        setLocationStatus('Lokasi ditemukan' + (accuracy ? ' · Akurasi sekitar ±' + formatDistance(accuracy / 1000) : '') + '. Jarak dihitung dalam garis lurus, bukan jarak perjalanan.' + (ranked.some(branch => branch.isPreview) ? ' Hasil menggunakan titik cabang dummy.' : ''));
        nearestPanel.hidden = false;
        nearestPanel.replaceChildren();
        ranked.slice(0, 3).forEach((branch, index) => {
            const card = document.createElement('article');
            card.className = 'nearest-card' + (index === 0 ? ' is-nearest' : '');
            const label = document.createElement('span');
            label.className = 'nearest-rank';
            label.textContent = index === 0 ? 'TERDEKAT DARI ANDA' : 'ALTERNATIF ' + (index + 1);
            const title = document.createElement('h4');
            title.textContent = branch.name;
            const distance = document.createElement('strong');
            distance.textContent = formatDistance(branch.distanceKm);
            const actions = document.createElement('div');
            actions.className = 'nearest-actions';
            const view = document.createElement('button');
            view.type = 'button';
            view.textContent = 'Lihat di peta';
            view.addEventListener('click', () => {
                showBranch(branch);
                container.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
            });
            actions.append(view);
            const website = safeWebsite(branch);
            if (website) {
                const link = document.createElement('a');
                link.href = website;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                link.textContent = 'Website cabang ↗';
                actions.append(link);
            }
            card.append(label, title, distance, actions);
            nearestPanel.append(card);
        });
        showBranch(ranked[0]);
        markers.forEach((marker, id) => marker.classList.toggle('is-nearest', id === ranked[0].id));
        select.querySelectorAll('option').forEach(option => {
            const branch = ranked.find(branch => branch.id === option.value);
            if (branch) option.textContent = branch.name + ' · ' + formatDistance(branch.distanceKm);
        });
    }
    locate.addEventListener('click', () => {
        if (!window.isSecureContext) {
            setLocationStatus('Akses lokasi memerlukan koneksi HTTPS. Anda tetap bisa memilih cabang secara manual.', true);
            return;
        }
        if (!navigator.geolocation) {
            setLocationStatus('Browser Anda belum mendukung akses lokasi. Pilih cabang secara manual.', true);
            return;
        }
        locate.disabled = true;
        locate.setAttribute('aria-busy', 'true');
        locate.querySelector('span').textContent = 'Mencari lokasi…';
        setLocationStatus('Izinkan akses lokasi pada browser untuk menemukan cabang terdekat.');
        function finish() {
            locate.disabled = false;
            locate.removeAttribute('aria-busy');
            locate.querySelector('span').textContent = userPosition ? 'Perbarui lokasi saya' : 'Coba akses lokasi';
        }
        navigator.geolocation.getCurrentPosition(position => {
            try { displayNearest(position); } finally { finish(); }
        }, error => {
            const messages = {
                1: 'Akses lokasi belum diizinkan. Izinkan lokasi melalui pengaturan browser, atau pilih cabang secara manual.',
                2: 'Lokasi belum tersedia. Aktifkan layanan lokasi perangkat, lalu coba lagi.',
                3: 'Pencarian lokasi terlalu lama. Silakan coba lagi atau pilih cabang secara manual.'
            };
            setLocationStatus(messages[error.code] || 'Lokasi belum dapat ditemukan. Silakan coba lagi.', true);
            finish();
        }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
    });

    const pins = document.getElementById('branch-map-pins');
    const image = document.getElementById('bali-map-image');
    image.addEventListener('error', () => { error.hidden = false; });
    image.addEventListener('load', () => { error.hidden = true; });
    branches.forEach(branch => {
        if (!Array.isArray(branch.mapPosition) || branch.mapPosition.length !== 2 || !branch.mapPosition.every(value => Number.isFinite(value) && value >= 0 && value <= 100)) return;
        const website = safeWebsite(branch);
        const marker = document.createElement(website ? 'a' : 'button');
        marker.className = 'bali-branch-pin';
        marker.style.left = branch.mapPosition[0] + '%';
        marker.style.top = branch.mapPosition[1] + '%';
        marker.setAttribute('aria-label', (website ? 'Buka website ' : 'Lihat ') + branch.name + (branch.isPreview ? ', data dummy' : ''));
        if (website) {
            marker.href = website;
            marker.target = '_blank';
            marker.rel = 'noopener noreferrer';
        } else marker.type = 'button';
        const face = document.createElement('span');
        face.className = 'bali-pin-face';
        const icon = document.createElement('span');
        icon.className = 'bali-pin-icon';
        icon.setAttribute('aria-hidden', 'true');
        icon.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a7 7 0 0 0-7 7c0 5 7 13 7 13s7-8 7-13a7 7 0 0 0-7-7Zm0 10a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/></svg>';
        const name = document.createElement('span');
        name.textContent = branch.mapLabel || branch.region;
        face.append(icon, name);
        marker.append(face);
        marker.addEventListener('click', () => showBranch(branch));
        pins.append(marker);
        markers.set(branch.id, marker);
    });
    reset.addEventListener('click', () => {
        select.value = '';
        detail.hidden = true;
        detail.replaceChildren();
        markers.forEach(marker => {
            marker.classList.remove('is-selected');
            marker.removeAttribute('aria-current');
        });
    });
})();
