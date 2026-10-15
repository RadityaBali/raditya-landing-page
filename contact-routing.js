/* Pure routing policy shared by the browser and tests. */
(function(root) {
    function activeSales(branchId, sales) {
        return sales.find(sale => sale.branchId === branchId && sale.active && /^\d{8,15}$/.test(sale.whatsapp || '')) || null;
    }
    function resolveContact({ referral, explicitBranchId, saved, nearestBranchId, branches, sales, now = Date.now() }) {
        const find = id => branches.find(branch => branch.id === id);
        const stored = saved && saved.expiresAt > now && find(saved.branchId) ? saved : null;
        const explicit = find(explicitBranchId);
        const manual = stored?.source === 'manual' ? find(stored.branchId) : null;
        const nearest = find(nearestBranchId) || (stored?.source === 'location' ? find(stored.branchId) : null);
        const validReferral = referral && sales.find(sale => sale.id === referral.sales.id && sale.active);
        const referralBranch = validReferral && find(validReferral.branchId);
        const serviceBranch = explicit || manual || nearest || referralBranch || null;
        const branch = referralBranch || serviceBranch;
        return { branch, serviceBranch, sales: referralBranch ? validReferral : branch ? activeSales(branch.id, sales) : null,
            source: referralBranch ? 'referral' : explicit ? 'page' : manual ? 'manual' : nearest ? 'location' : 'central' };
    }
    const api = { activeSales, resolveContact };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.radityaContactPolicy = api;
})(typeof window !== 'undefined' ? window : globalThis);
