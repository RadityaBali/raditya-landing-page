(function(root) {
    const KEY = 'raditya-sales-referral-v1';
    const DURATION = 30 * 24 * 60 * 60 * 1000;
    function resolveReferral(search, saved, sales, branches, now = Date.now()) {
        const params = new URLSearchParams(search);
        const explicit = params.has('ref');
        const code = explicit ? params.get('ref') : saved && saved.expiresAt > now ? saved.salesId : null;
        const salesperson = sales.find(item => item.id === code && item.active);
        const branch = salesperson && branches.find(item => item.id === salesperson.branchId);
        if (!salesperson || !branch) return { referral: null, invalid: explicit, clear: explicit || Boolean(saved) };
        return { referral: { sales: salesperson, branch, expiresAt: explicit ? now + DURATION : saved.expiresAt }, invalid: false, clear: false };
    }
    function createLink(base, salesperson) {
        const slug = salesperson.branchId;
        const url = new URL('cabang/' + slug + '/', base);
        url.search = ''; url.hash = '';
        url.searchParams.set('cabang', salesperson.branchId);
        url.searchParams.set('ref', salesperson.id);
        return url.href;
    }
    const api = { resolveReferral, createLink, KEY, DURATION };
    if (typeof module !== 'undefined' && module.exports) { module.exports = api; return; }
    root.radityaReferral = api;
    const base = new URL('.', document.currentScript.src);
    api.ready = (async () => {
        try {
            const responses = await Promise.all([fetch(new URL('sales.json', base)), fetch(new URL('branches.json?v=network-1', base)), fetch(new URL('site-config.json', base))]);
            if (responses.some(response => !response.ok)) throw new Error('Referral configuration unavailable');
            const [sales, branches, config] = await Promise.all(responses.map(response => response.json()));
            api.sales = sales; api.branches = branches; api.config = config;
            let saved;
            try { saved = JSON.parse(localStorage.getItem(KEY)); } catch { saved = null; }
            const result = resolveReferral(location.search, saved, sales, branches);
            try {
                if (result.referral) localStorage.setItem(KEY, JSON.stringify({ salesId: result.referral.sales.id, expiresAt: result.referral.expiresAt }));
                else if (result.clear) localStorage.removeItem(KEY);
            } catch { /* Current-link referral still works when storage is unavailable. */ }
            api.current = result.referral;
            api.invalid = result.invalid;
            if (result.referral) {
                document.querySelectorAll('a[href]').forEach(link => {
                    if (link.getAttribute('href').startsWith('#')) return;
                    const url = new URL(link.getAttribute('href'), location.href);
                    if (url.origin === location.origin && !url.searchParams.has('ref') && (url.pathname.endsWith('.html') || url.pathname.endsWith('/'))) {
                        url.searchParams.set('ref', result.referral.sales.id);
                        link.href = url.href;
                    }
                });

            }
            if (result.invalid) {
                const banner = document.getElementById('sales-referral-banner');
                if (banner) { banner.hidden = false; banner.textContent = 'Kode referral tidak dikenali. Pilih cabang pada formulir untuk menghubungi sales.'; }
            }
            return api.current;
        } catch {
            api.failed = true;
            return null;
        }
    })();
})(typeof window !== 'undefined' ? window : globalThis);
