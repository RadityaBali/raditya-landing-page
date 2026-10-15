/* Backward compatibility for links shared before dedicated branch URLs existed. */
(async () => {
    try {
        const response = await fetch('/branches.json?v=network-1');
        if (!response.ok) throw new Error('Branch data unavailable');
        const branches = await response.json();
        const params = new URLSearchParams(location.search);
        const branch = branches.find(item => item.id === params.get('cabang'));
        const target = new URL(branch?.website || '/cabang/', location.origin);
        if (params.has('ref')) target.searchParams.set('ref', params.get('ref'));
        location.replace(target.href);
    } catch {
        document.getElementById('legacy-branch-status').textContent = 'Halaman cabang belum dapat dibuka. Gunakan daftar cabang di bawah ini.';
    }
})();
