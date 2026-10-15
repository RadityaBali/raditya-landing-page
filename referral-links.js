(async () => {
    const base = document.getElementById('ref-base-url');
    const feedback = document.getElementById('ref-feedback');
    const list = document.getElementById('referral-list');
    base.value = new URL('./', location.href).href;
    try {
        const response = await fetch('sales.json');
        if (!response.ok) throw new Error('Unavailable');
        const sales = await response.json();
        function render() {
            let baseUrl;
            try { baseUrl = new URL(base.value); if (!['http:', 'https:'].includes(baseUrl.protocol)) throw new Error('Invalid'); }
            catch { feedback.textContent = 'Masukkan alamat website HTTP atau HTTPS yang valid.'; return; }
            feedback.textContent = ''; list.replaceChildren();
            sales.filter(sale => sale.active).forEach(sale => {
                const row = document.createElement('article'); row.className = 'ref-row';
                const title = document.createElement('h2'); title.textContent = sale.name;
                const info = document.createElement('small'); info.textContent = `${sale.id} · +${sale.whatsapp} · ${sale.isDummy ? 'Nomor dummy' : 'Sales aktif'}`;
                const input = document.createElement('input'); input.className = 'ref-link'; input.readOnly = true; input.value = radityaReferral.createLink(baseUrl.href, sale); input.setAttribute('aria-label', 'Link referral ' + sale.name);
                const actions = document.createElement('div'); actions.className = 'ref-actions';
                const copy = document.createElement('button'); copy.type = 'button'; copy.textContent = 'Salin link';
                copy.addEventListener('click', async () => { try { await navigator.clipboard.writeText(input.value); feedback.textContent = 'Link ' + sale.name + ' disalin.'; } catch { input.focus(); input.select(); feedback.textContent = 'Salin link yang sudah dipilih pada kolom.'; } });
                const preview = document.createElement('a'); preview.href = input.value; preview.target = '_blank'; preview.rel = 'noopener noreferrer'; preview.textContent = 'Buka pratinjau ↗';
                actions.append(copy, preview); row.append(title, info, input, actions); list.append(row);
            });
        }
        base.addEventListener('change', render); render();
    } catch { feedback.textContent = 'Daftar sales belum dapat dimuat. Silakan muat ulang halaman.'; }
})();
