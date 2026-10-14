(async () => {
    try {
        const response = await fetch('branches.json');
        if (!response.ok) throw new Error('Data unavailable');
        const branches = await response.json();
        const id = new URLSearchParams(location.search).get('cabang');
        const branch = branches.find(item => item.id === id);
        if (!branch) {
            document.getElementById('branch-name').textContent = 'Cabang belum ditemukan';
            document.getElementById('branch-address').textContent = 'Kembali ke daftar cabang untuk memilih wilayah.';
            return;
        }
        document.title = branch.name + ' — Website Contoh Cabang';
        document.getElementById('branch-name').textContent = branch.name;
        document.getElementById('branch-region').textContent = 'CABANG ' + branch.region.toUpperCase();
        document.getElementById('region-label').textContent = 'RADITYA / ' + branch.region.toUpperCase();
        document.getElementById('branch-address').textContent = branch.address;
    } catch {
        document.getElementById('branch-address').textContent = 'Data cabang belum dapat dimuat. Silakan muat ulang halaman.';
    }
})();
