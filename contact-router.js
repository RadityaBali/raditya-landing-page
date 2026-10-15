/* One contact context across the public website; precise location is never stored. */
(function() {
    const KEY = 'raditya-service-branch-v1';
    const duration = 30 * 24 * 60 * 60 * 1000;
    const api = window.radityaContact = {};
    let branches = [], sales = [], saved = null, explicitBranchId, nearestBranchId, referral;
    let locating = false;
    function save(branchId, source) {
        saved = { branchId, source, expiresAt: Date.now() + (source === 'location' ? 86400000 : duration) };
        try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch { /* Routing still works in this page. */ }
    }
    function update() {
        api.current = radityaContactPolicy.resolveContact({ referral, explicitBranchId, saved, nearestBranchId, branches, sales });
        const current = api.current;
        document.querySelectorAll('[data-service-select]').forEach(select => { select.value = current.serviceBranch?.id || ''; });
        document.querySelectorAll('[data-contact-status]').forEach(el => {
            el.textContent = current.sales ? (current.source === 'referral' ? 'Sales pendamping: ' + current.sales.name : 'Anda dilayani ' + current.branch.name) : current.branch ? 'Kontak cabang belum tersedia · Dibantu admin pusat' : 'Selamat datang · Pilih cabang yang dekat dengan Anda';
        });
        document.querySelectorAll('[data-contact-note]').forEach(el => {
            el.textContent = current.source === 'referral' ? 'Sales dari link Anda tetap mendampingi. Cabang pengiriman dapat dipilih terpisah.' : current.source === 'location' ? 'Dipilih dari lokasi terdekat. Anda dapat mengganti cabang kapan saja.' : 'Pilihan cabang digunakan untuk konsultasi dan pembelian Anda.';
            if (current.sales?.isDummy) el.textContent += ' Kontak masih contoh.';
        });
        document.querySelectorAll('a[href]').forEach(link => {
            const url = new URL(link.getAttribute('href'), location.href);
            if (url.hostname !== 'wa.me') return;
            if (!link.dataset.originalPhone) link.dataset.originalPhone = url.pathname.slice(1);
            const pinned = link.dataset.contactBranch;
            const isCentralContact = Object.prototype.hasOwnProperty.call(link.dataset, 'contactCentral');
            const recipient = isCentralContact ? null : (pinned ? radityaContactPolicy.activeSales(pinned, sales) : current.sales);
            url.pathname = '/' + (recipient?.whatsapp || radityaReferral.config.centralWhatsapp);
            link.href = url.href;
            link.dataset.contactSales = recipient?.id || 'central';
            link.title = recipient ? 'Hubungi ' + recipient.name + (recipient.isDummy ? ' · Nomor contoh' : '') : 'Hubungi admin pusat Raditya Bali';
            if (link.textContent.trim().startsWith('WhatsApp:')) link.textContent = 'WhatsApp: +' + url.pathname.slice(1);
        });
        document.querySelectorAll('a[data-catalog-link]').forEach(link => {
            const url = new URL(link.href);
            if (current.serviceBranch) url.searchParams.set('cabang', current.serviceBranch.id);
            else url.searchParams.delete('cabang');
            if (referral) url.searchParams.set('ref', referral.sales.id);
            link.href = url.href;
        });
        document.dispatchEvent(new CustomEvent('raditya:contact', { detail: current }));
    }
    api.chooseBranch = id => {
        if (!branches.some(branch => branch.id === id)) return;
        explicitBranchId = null;
        save(id, 'manual');
        // Keep reload and shared URLs consistent with an intentional change.
        const url = new URL(location.href);
        url.searchParams.set('cabang', id);
        history.replaceState(null, '', url);
        update();
    };
    api.adoptNearest = id => {
        if (!branches.some(branch => branch.id === id)) return;
        nearestBranchId = id;
        if (!explicitBranchId && !(saved?.source === 'manual' && saved.expiresAt > Date.now())) save(id, 'location');
        update();
    };
    api.salesForBranch = id => radityaContactPolicy.activeSales(id, sales);
    function geoStatus(text) { document.querySelectorAll('[data-location-feedback]').forEach(el => { el.textContent = text; }); }
    api.locate = async ({ silent = false } = {}) => {
        await api.ready;
        if (locating || api.failed) return;
        if (!navigator.geolocation || !window.isSecureContext) { if (!silent) geoStatus('Lokasi belum tersedia. Silakan pilih cabang dari daftar.'); return; }
        locating = true;
        const buttons = [...document.querySelectorAll('[data-find-branch], #branch-locate')];
        buttons.forEach(button => { button.disabled = true; button.setAttribute('aria-busy', 'true'); });
        if (!silent) geoStatus('Mencari lokasi Anda… Izinkan akses lokasi melalui browser.');
        navigator.geolocation.getCurrentPosition(position => {
            const coordinates = [position.coords.latitude, position.coords.longitude];
            if (!coordinates.every(Number.isFinite) || Math.abs(coordinates[0]) > 90 || Math.abs(coordinates[1]) > 180) { geoStatus('Lokasi belum dapat dibaca. Pilih cabang secara manual.'); finish(); return; }
            const ranked = branchDistance.rankBranches(coordinates, branches);
            if (ranked.length) {
                api.adoptNearest(ranked[0].id);
                geoStatus('Cabang terdekat: ' + ranked[0].name + '. Perkiraan jarak garis lurus.' + (ranked[0].isPreview ? ' Titik cabang masih contoh.' : ''));
                document.dispatchEvent(new CustomEvent('raditya:location', { detail: position }));
            } else geoStatus('Titik cabang belum tersedia. Pilih cabang dari daftar.');
            finish();
        }, error => {
            geoStatus(error.code === 1 ? 'Akses lokasi belum diizinkan. Anda tetap bisa memilih cabang.' : 'Lokasi belum ditemukan. Coba lagi atau pilih cabang dari daftar.');
            finish();
        }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 });
        function finish() { locating = false; buttons.forEach(button => { button.disabled = false; button.removeAttribute('aria-busy'); }); }
    };
    api.ready = (async () => {
        referral = await radityaReferral.ready;
        if (radityaReferral.failed) {
            api.failed = true;
            document.querySelectorAll('[data-contact-status]').forEach(el => { el.textContent = 'Pilihan cabang belum dapat dimuat. Silakan muat ulang halaman.'; });
            document.querySelectorAll('[data-find-branch], [data-service-select], #branch-locate').forEach(el => { el.disabled = true; });
            return;
        }
        branches = radityaReferral.branches; sales = radityaReferral.sales;
        try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { saved = null; }
        const requestedBranch = new URLSearchParams(location.search).get('cabang');
        explicitBranchId = branches.some(branch => branch.id === requestedBranch) ? requestedBranch : document.body.dataset.branchId;
        document.querySelectorAll('[data-service-select]').forEach(select => {
            select.replaceChildren(new Option('Pilih cabang', ''));
            branches.forEach(branch => select.append(new Option(branch.mapLabel || branch.region, branch.id)));
            select.addEventListener('change', () => { if (select.value) api.chooseBranch(select.value); else update(); });
        });
        document.querySelectorAll('[data-find-branch]').forEach(button => button.addEventListener('click', () => api.locate()));
        update();
        // Only reuse permission already granted; a new visitor chooses when to share location.
        if (!explicitBranchId && !referral && !(saved?.source === 'manual' && saved.expiresAt > Date.now()) && navigator.permissions) {
            navigator.permissions.query({ name: 'geolocation' }).then(permission => { if (permission.state === 'granted') api.locate({ silent: true }); }).catch(() => {});
        }
        return api.current;
    })();
})();
