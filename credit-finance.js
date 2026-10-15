(function(root) {
    const rupiah = number => 'Rp ' + Math.round(number).toLocaleString('id-ID');
    function normalizePhone(value) {
        const phone = String(value || '').replace(/[\s()+-]/g, '').replace(/^0/, '62');
        return /^62\d{8,13}$/.test(phone) ? phone : null;
    }
    function simulate(price, method, tenor) {
        if (!Number.isFinite(price) || price <= 0 || !method || !method.tenors.includes(tenor)) return null;
        const dp = Math.round(price * method.downPaymentPercent / 100);
        const principal = price - dp;
        const interest = principal * method.monthlyInterestPercent / 100 * tenor;
        return { dp, principal, monthly: Math.ceil((principal + interest) / tenor), total: dp + Math.ceil((principal + interest) / tenor) * tenor };
    }
    function buildMessage({ branch, referralCode, method, type, product, price, name, address, tenor, delivery }) {
        const lines = [`Halo ${branch.sales.name}, saya ingin ${type === 'cash' ? 'memesan secara tunai' : 'mengajukan pembiayaan'} di ${branch.name}.`, '', `Produk: ${product}`, `Nama: ${name}`, `Alamat: ${address}`, `Cabang: ${branch.name}`, `Sales: ${branch.sales.name}`, `Harga produk: ${price > 0 ? rupiah(price) : 'Mohon konfirmasi harga'}`];
        if (referralCode) lines.push('Kode referral: ' + referralCode);
        if (type !== 'cash') {
            lines.push(`Metode pembiayaan: ${method.name}`, `Tenor pilihan: ${tenor} bulan`);
            const calculation = simulate(price, method, tenor);
            if (calculation) lines.push(`DP simulasi: ${rupiah(calculation.dp)}`, `Bunga flat simulasi: ${method.monthlyInterestPercent}% per bulan`, `Angsuran simulasi: ${rupiah(calculation.monthly)} per bulan`);
            else lines.push('DP dan angsuran: Mohon konfirmasi kepada sales.');
            if (method.isDummy) lines.push('Skema pembiayaan di atas adalah data dummy, bukan ketentuan resmi penyedia dan belum termasuk biaya tambahan. Mohon konfirmasi program yang tersedia.');
        }
        if (delivery) {
            lines.push(`Cabang pengiriman: ${branch.name}`, `Jarak pengiriman dari cabang: ${delivery.distance.toFixed(1)} km`, `Estimasi ongkir: ${rupiah(delivery.cost)}`);
            if (delivery.destination) lines.push('Titik rumah: https://www.google.com/maps/search/?api=1&query=' + delivery.destination.join(','));
            if (type === 'cash' && price > 0) lines.push('Total estimasi cash (produk + ongkir): ' + rupiah(price + delivery.cost));
        }
        else lines.push('Ongkir: Mohon konfirmasi berdasarkan alamat pengiriman.');
        if (branch.sales.isDummy) lines.push('Pratinjau: Nomor sales dan lokasi cabang menggunakan data dummy.');
        return lines.join('\n');
    }
    const api = { normalizePhone, simulate, buildMessage, rupiah };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.creditFinance = api;
})(typeof window !== 'undefined' ? window : globalThis);
