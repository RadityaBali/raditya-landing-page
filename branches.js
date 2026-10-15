/* Branch locations and external websites are managed in branches.json. */
(async function initBranchMap() {
    const container = document.getElementById('branch-map');
    const select = document.getElementById('branch-select');
    const detail = document.getElementById('branch-map-detail');
    const status = document.getElementById('branch-map-status');
    const error = document.getElementById('branch-map-error');
    const markers = new Map();
    let branches;
    let userPosition;
    const locate = document.getElementById('branch-locate');
    const locationStatus = document.getElementById('branch-location-status');
    const nearestPanel = document.getElementById('branch-nearest');
    const formatDistance = distance => distance < 1 ? Math.round(distance * 1000) + ' m' : new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 }).format(distance) + ' km';
    try {
        const response = await fetch('branches.json?v=network-1');
        if (!response.ok) throw new Error('Branch data unavailable');
        branches = await response.json();
    } catch {
        status.textContent = 'Daftar cabang belum dapat dimuat. Silakan muat ulang halaman.';
        locate.disabled = true;
        return;
    }
    if (window.radityaContact) await radityaContact.ready;
    const safeWebsite = branch => {
        if (!branch.website) return null;
        try {
            const url = new URL(branch.website, window.location.href);
            if (window.radityaReferral?.current && url.origin === window.location.origin) url.searchParams.set('ref', radityaReferral.current.sales.id);
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
        address.textContent = branch.address || 'Hubungi tim untuk informasi alamat cabang.';
        const info = document.createElement('div');
        info.className = 'branch-detail-info';
        info.append(label, title, address);
        if (branch.hours) {
            const hours = document.createElement('p');
            hours.textContent = branch.hours;
            info.append(hours);
        }
        detail.append(info);
        const actions = document.createElement('div');
        actions.className = 'branch-detail-actions';
        if (userPosition) {
            const distance = document.createElement('p');
            distance.className = 'branch-distance-label';
            distance.textContent = formatDistance(branchDistance.distanceKm(userPosition, branch.coordinates)) + ' dari lokasi Anda · Jarak garis lurus';
            info.append(distance);
        }
        const website = safeWebsite(branch);
        if (website) {
            const link = document.createElement('a');
            link.className = 'pill-link';
            link.href = website;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = 'Buka website cabang ↗';
            actions.append(link);
        } else {
            const note = document.createElement('p');
            note.className = 'branch-website-pending';
            note.textContent = 'Website cabang belum tersedia.';
            actions.append(note);
        }
        const directions = document.createElement('a');
        directions.className = 'branch-directions';
        directions.href = 'https://www.google.com/maps/dir/?api=1&destination=' + encodeURIComponent(branch.coordinates.join(','));
        directions.target = '_blank';
        directions.rel = 'noopener noreferrer';
        directions.textContent = 'Petunjuk arah ↗';
        actions.append(directions);
        detail.append(actions);
        nearestPanel.querySelectorAll('button').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.branchId === branch.id));
        });
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

    });
    select.addEventListener('change', () => {
        const branch = branches.find(branch => branch.id === select.value);
        if (branch) { showBranch(branch); window.radityaContact?.chooseBranch(branch.id); }
        else showBranch(branches[0]);
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
        const caption = document.createElement('span');
        caption.textContent = 'Di sekitar Anda';
        nearestPanel.append(caption);
        ranked.slice(0, 3).forEach((branch, index) => {
            const choice = document.createElement('button');
            choice.type = 'button';
            choice.dataset.branchId = branch.id;
            choice.textContent = (index === 0 ? 'Terdekat · ' : '') + branch.region + ' · ' + formatDistance(branch.distanceKm);
            choice.addEventListener('click', () => { showBranch(branch); window.radityaContact?.chooseBranch(branch.id); });
            nearestPanel.append(choice);
        });
        showBranch(ranked[0]);
        markers.forEach((marker, id) => marker.classList.toggle('is-nearest', id === ranked[0].id));
        select.querySelectorAll('option').forEach(option => {
            const branch = ranked.find(branch => branch.id === option.value);
            if (branch) option.textContent = branch.name + ' · ' + formatDistance(branch.distanceKm);
        });
    }
    locate.addEventListener('click', () => {
        locationStatus.hidden = false;
        window.radityaContact?.locate();
    });
    document.addEventListener('raditya:location', event => displayNearest(event.detail));
    document.addEventListener('raditya:contact', event => {
        const branch = branches.find(branch => branch.id === event.detail.serviceBranch?.id);
        if (branch) showBranch(branch);
    });

    const pins = document.getElementById('branch-map-pins');
    const image = document.getElementById('bali-map-image');
    image.addEventListener('error', () => { error.hidden = false; });
    image.addEventListener('load', () => { error.hidden = true; });
    branches.forEach(branch => {
        if (!Array.isArray(branch.mapPosition) || branch.mapPosition.length !== 2 || !branch.mapPosition.every(value => Number.isFinite(value) && value >= 0 && value <= 100)) return;
        const marker = document.createElement('button');
        marker.className = 'bali-branch-pin';
        marker.style.left = branch.mapPosition[0] + '%';
        marker.style.top = branch.mapPosition[1] + '%';
        marker.setAttribute('aria-label', 'Lihat detail ' + branch.name + (branch.isPreview ? ', data dummy' : ''));
        marker.type = 'button';
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
        marker.addEventListener('click', () => { showBranch(branch); window.radityaContact?.chooseBranch(branch.id); });
        pins.append(marker);
        markers.set(branch.id, marker);
    });
    showBranch(branches.find(branch => branch.id === window.radityaContact?.current?.serviceBranch?.id) || branches[0]);
})();
