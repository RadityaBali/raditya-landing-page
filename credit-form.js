let creditBranches = [];
let creditMethods = [];
let creditReferral = null;
const creditBranchSelect = document.getElementById('credit-branch');
const creditMethodSelect = document.getElementById('credit-method');
function getKredivoSchedule(method, tenor) {
    if (method?.id !== 'kredivo') return null;
    return getCreditProductSpec().kredivo?.[tenor] || null;
}
function formatKredivoSchedule(schedule) {
    return schedule.map(period => `Bln ${period.from}–${period.to}: ${creditFinance.rupiah(period.installment)}`).join('\n');
}
function getMandiriMonthly(method, dp, tenor) {
    if (method?.id !== 'mandiri') return null;
    return getCreditProductSpec().mandiri?.[dp]?.[tenor] || null;
}
function updateCreditBranch() {
    const branch = creditBranches.find(item => item.id === creditBranchSelect.value);
    const salesperson = creditReferral?.sales || window.radityaContact?.salesForBranch(branch?.id);
    const phone = creditFinance.normalizePhone(salesperson?.whatsapp);
    const button = document.getElementById('credit-submit');
    const label = document.getElementById('btn-submit-wa-text');
    const info = document.getElementById('credit-sales-info');
    button.disabled = !phone || (currentTxType !== 'cash' && !creditMethods.length);
    label.textContent = (currentTxType === 'cash' ? 'Pesan' : 'Ajukan') + ' via WhatsApp' + (branch ? ' · ' + (creditReferral ? salesperson.name : branch.region) : '');
    info.textContent = branch ? `${salesperson.name} · +${salesperson.whatsapp}${salesperson.isDummy ? ' · Nomor dummy untuk pratinjau' : ''}${creditReferral ? ' · Sales dari link referral Anda' : ''}` : 'Pilih cabang untuk menghubungi sales yang sesuai.';
    setDeliveryBranch(branch);
    updateCashSummary();
}
function updateCreditSimulation() {
    currentTxType = document.getElementById('credit-payment').value;
    const isCash = currentTxType === 'cash';
    document.getElementById('credit-method-group').hidden = isCash;
    document.getElementById('credit-method').disabled = isCash || !creditMethods.length;
    document.getElementById('credit-method').required = !isCash;
    document.getElementById('kredit-tenor-group').hidden = isCash;
    document.getElementById('kredit-tenor-group').style.display = isCash ? 'none' : 'block';
    document.getElementById('kredit-info-box').hidden = isCash;
    document.getElementById('credit-cash-summary').hidden = !isCash;
    document.querySelectorAll('input[name="cicilan"]').forEach(input => { input.disabled = isCash; input.required = !isCash; });
    const method = creditMethods.find(item => item.id === creditMethodSelect.value);
    document.getElementById('kredit-modal-subtitle').textContent = currentTxType === 'cash' ? 'Pembelian Tunai' : 'Simulasi ' + (method?.name || 'Pembiayaan');
    document.getElementById('credit-installment-label').textContent = 'Estimasi angsuran per bulan';
    document.getElementById('credit-upfront-label').textContent = 'Uang muka (DP)';
    document.getElementById('credit-rate-label').textContent = 'Bunga flat contoh';
    document.getElementById('credit-rate-unit').textContent = '% / Bln';
    if (currentTxType === 'cash') {
        document.getElementById('credit-dp-group').hidden = true;
        updateCreditBranch();
        return;
    }
    const spec = getCreditProductSpec();
    const isMandiri = method?.id === 'mandiri';
    const dpGroup = document.getElementById('credit-dp-group');
    const dpSelect = document.getElementById('credit-dp-select');

    if (isMandiri && spec.mandiri) {
        dpGroup.hidden = false;
        const availableDps = Object.keys(spec.mandiri).map(Number).sort((a, b) => a - b);
        const currentDp = Number(dpSelect.value);
        dpSelect.replaceChildren();
        availableDps.forEach(dp => {
            const opt = document.createElement('option');
            opt.value = String(dp);
            opt.textContent = creditFinance.rupiah(dp);
            dpSelect.append(opt);
        });
        if (availableDps.includes(currentDp)) dpSelect.value = String(currentDp);
        else dpSelect.value = String(availableDps[0] || '');
    } else {
        dpGroup.hidden = true;
    }

    const selectedDp = Number(dpSelect.value) || 0;
    const group = document.getElementById('kredit-radio-group');
    const previousTenor = Number(group.querySelector('input:checked')?.value);
    group.replaceChildren();
    if (!method) return;
    const tenors = method.tenors.filter(tenor => method.id !== 'koperasi' || currentCategory !== 'sepeda' || tenor <= 36);
    const selectedTenor = tenors.includes(previousTenor) ? previousTenor : tenors[0];
    const selectedKredivoSchedule = getKredivoSchedule(method, selectedTenor);
    const selectedMandiriMonthly = isMandiri ? getMandiriMonthly(method, selectedDp, selectedTenor) : null;
    const minCalculation = (method.id === 'kredivo' || isMandiri) ? null : creditFinance.simulate(spec.price, method, tenors[tenors.length - 1]);

    if (selectedKredivoSchedule) {
        document.getElementById('credit-method-note').textContent = 'Promo Kredivo 0% untuk 12 bulan pertama dengan admin fee 15%. Nominal angsuran mengikuti skema OTR Bali resmi.';
        document.getElementById('credit-installment-label').textContent = selectedKredivoSchedule.length > 1 ? 'Angsuran bulan 1–12' : 'Angsuran per bulan';
        document.getElementById('credit-upfront-label').textContent = 'Harga OTR';
        document.getElementById('credit-rate-label').textContent = 'Admin fee';
        document.getElementById('kredit-price-display').textContent = creditFinance.rupiah(spec.price);
        document.getElementById('kredit-rate-percentage').textContent = '15';
        document.getElementById('credit-rate-unit').textContent = '%';
        document.getElementById('kredit-interest-display').textContent = creditFinance.rupiah(selectedKredivoSchedule[0].installment);
    } else if (isMandiri && spec.mandiri) {
        document.getElementById('credit-method-note').textContent = 'Skema resmi Mandiri Utama Finance (MUF) untuk VinFast Bali. Syarat: KTP Suami/Istri, KK, Rek Listrik/Air/Telkom, Slip Gaji/Rekening Koran.';
        document.getElementById('credit-installment-label').textContent = 'Angsuran per bulan';
        document.getElementById('credit-upfront-label').textContent = 'Uang muka (DP)';
        document.getElementById('credit-rate-label').textContent = 'Tenor';
        document.getElementById('kredit-price-display').textContent = creditFinance.rupiah(selectedDp);
        document.getElementById('kredit-rate-percentage').textContent = String(selectedTenor);
        document.getElementById('credit-rate-unit').textContent = ' Bln';
        document.getElementById('kredit-interest-display').textContent = selectedMandiriMonthly ? creditFinance.rupiah(selectedMandiriMonthly) : 'Pilih tenor';
    } else {
        document.getElementById('credit-method-note').textContent = 'Skema resmi ' + method.name + '. Nilai angsuran dapat dikonfirmasi lebih lanjut bersama sales cabang.';
        document.getElementById('kredit-price-display').textContent = minCalculation ? creditFinance.rupiah(minCalculation.dp) : 'Tanya sales';
        document.getElementById('kredit-rate-percentage').textContent = method.monthlyInterestPercent.toLocaleString('id-ID', { maximumFractionDigits: 2 });
        document.getElementById('kredit-interest-display').textContent = minCalculation ? creditFinance.rupiah(minCalculation.monthly) : 'Tanya sales';
    }
    tenors.forEach(tenor => {
        const schedule = getKredivoSchedule(method, tenor);
        const mandiriMonthly = isMandiri ? getMandiriMonthly(method, selectedDp, tenor) : null;
        const calculation = (method.id === 'kredivo' || isMandiri) ? null : creditFinance.simulate(spec.price, method, tenor);
        const row = document.createElement('label');
        row.className = 'radio-item';
        const input = document.createElement('input');
        input.type = 'radio'; input.name = 'cicilan'; input.value = String(tenor); input.required = true; input.checked = tenor === selectedTenor;
        input.style.accentColor = '#0b4f69';
        const span = document.createElement('span');
        const duration = document.createElement('strong');
        duration.textContent = tenor + ' bulan';
        const monthly = document.createElement('small');
        monthly.textContent = schedule ? formatKredivoSchedule(schedule) : mandiriMonthly ? creditFinance.rupiah(mandiriMonthly) + ' / bln' : calculation ? creditFinance.rupiah(calculation.monthly) + ' / bln' : 'Tanya sales';
        span.append(duration, monthly);
        input.addEventListener('change', updateSelectedCreditAmount);
        row.append(input, span); group.append(row);
    });
    updateSelectedCreditAmount();
    updateCreditBranch();
}
function updateSelectedCreditAmount() {
    const method = creditMethods.find(item => item.id === creditMethodSelect.value);
    const tenor = Number(document.querySelector('input[name="cicilan"]:checked')?.value);
    const spec = getCreditProductSpec();
    const schedule = getKredivoSchedule(method, tenor);
    if (schedule) {
        document.getElementById('credit-installment-label').textContent = schedule.length > 1 ? 'Angsuran bulan 1–12' : 'Angsuran per bulan';
        document.getElementById('kredit-interest-display').textContent = creditFinance.rupiah(schedule[0].installment);
        return;
    }
    if (method?.id === 'mandiri') {
        const dp = Number(document.getElementById('credit-dp-select')?.value || 0);
        const monthly = getMandiriMonthly(method, dp, tenor);
        document.getElementById('credit-installment-label').textContent = 'Angsuran per bulan';
        document.getElementById('credit-upfront-label').textContent = 'Uang muka (DP)';
        document.getElementById('kredit-price-display').textContent = creditFinance.rupiah(dp);
        document.getElementById('kredit-rate-percentage').textContent = String(tenor || '-');
        document.getElementById('credit-rate-unit').textContent = ' Bln';
        document.getElementById('kredit-interest-display').textContent = monthly ? creditFinance.rupiah(monthly) : 'Tanya sales';
        return;
    }
    const calculation = creditFinance.simulate(spec.price, method, tenor);
    document.getElementById('kredit-interest-display').textContent = calculation ? creditFinance.rupiah(calculation.monthly) : 'Tanya sales';
}
function updateCashSummary() {
    const price = getCreditProductSpec().price;
    document.getElementById('cash-price-display').textContent = price > 0 ? creditFinance.rupiah(price) : 'Konfirmasi sales';
    document.getElementById('cash-delivery-display').textContent = deliveryReady ? creditFinance.rupiah(currentOngkir) : deliveryLocationKnown ? 'Menunggu perhitungan' : 'Pilih titik rumah';
    document.getElementById('cash-total-display').textContent = price > 0 ? creditFinance.rupiah(price + (deliveryReady ? currentOngkir : 0)) : 'Konfirmasi harga';
    document.getElementById('cash-total-note').textContent = price <= 0 ? 'Harga produk belum tersedia. Total pembayaran dikonfirmasi sales.' : deliveryReady ? 'Total estimasi harga produk + ongkir. Konfirmasi pembayaran kepada sales.' : 'Harga produk; ongkir ditambahkan setelah cabang dan titik rumah dipilih.';
}
creditBranchSelect.addEventListener('change', () => {
    window.radityaContact?.chooseBranch(creditBranchSelect.value);
    updateCreditBranch();
});
document.addEventListener('raditya:contact', event => {
    const id = event.detail.serviceBranch?.id;
    if (id && creditBranches.some(branch => branch.id === id)) { creditBranchSelect.value = id; updateCreditBranch(); }
});
document.getElementById('credit-payment').addEventListener('change', updateCreditSimulation);
creditMethodSelect.addEventListener('change', updateCreditSimulation);
document.getElementById('credit-variant')?.addEventListener('change', () => {
    updateCreditSimulation();
    updateCashSummary();
});
document.getElementById('credit-dp-select')?.addEventListener('change', updateCreditSimulation);
(async () => {
    try {
        const [branchResponse, methodResponse] = await Promise.all([fetch('branches.json?v=network-1'), fetch('financing.json')]);
        if (!branchResponse.ok || !methodResponse.ok) throw new Error('Configuration unavailable');
        [creditBranches, creditMethods] = await Promise.all([branchResponse.json(), methodResponse.json()]);
        creditBranchSelect.replaceChildren();
        const placeholder = document.createElement('option'); placeholder.value = ''; placeholder.textContent = 'Pilih cabang Raditya Bali'; creditBranchSelect.append(placeholder);
        creditBranches.forEach(branch => { const option = document.createElement('option'); option.value = branch.id; option.textContent = branch.name; creditBranchSelect.append(option); });
        creditMethodSelect.replaceChildren();
        creditMethods.forEach(method => { const option = document.createElement('option'); option.value = method.id; option.textContent = method.name + (method.isDummy ? ' · Simulasi dummy' : ''); creditMethodSelect.append(option); });
        creditMethodSelect.value = creditMethods[0]?.id || '';
        creditBranchSelect.disabled = false; creditMethodSelect.disabled = false;
        creditReferral = await radityaReferral.ready;
        if (radityaReferral.failed) throw new Error('Referral unavailable');
        await radityaContact.ready;
        creditBranchSelect.value = radityaContact.current?.serviceBranch?.id || '';
        updateCreditSimulation();
    } catch {
        document.getElementById('credit-sales-info').hidden = false;
        document.getElementById('credit-sales-info').textContent = 'Data cabang dan metode belum dapat dimuat. Silakan muat ulang halaman.';
        document.getElementById('credit-submit').disabled = true;
    }
})();
