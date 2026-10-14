/* Great-circle distances in kilometres; no external routing or location service. */
(function (root) {
    function distanceKm(from, to) {
        const radians = degrees => degrees * Math.PI / 180;
        const latDelta = radians(to[0] - from[0]);
        const lngDelta = radians(to[1] - from[1]);
        const a = Math.sin(latDelta / 2) ** 2 + Math.cos(radians(from[0])) * Math.cos(radians(to[0])) * Math.sin(lngDelta / 2) ** 2;
        return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(Math.max(0, 1 - a)));
    }
    function rankBranches(position, branches) {
        return branches.filter(branch => Array.isArray(branch.coordinates) && branch.coordinates.length === 2 && branch.coordinates.every(Number.isFinite) && Math.abs(branch.coordinates[0]) <= 90 && Math.abs(branch.coordinates[1]) <= 180)
            .map(branch => ({ ...branch, distanceKm: distanceKm(position, branch.coordinates) }))
            .sort((a, b) => a.distanceKm - b.distanceKm);
    }
    const api = { distanceKm, rankBranches };
    if (typeof module !== 'undefined' && module.exports) module.exports = api;
    else root.branchDistance = api;
})(typeof window !== 'undefined' ? window : globalThis);
