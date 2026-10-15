# Referral sales Raditya Bali

Buka `referral-links.html` untuk menghasilkan dan menyalin link setiap sales. Format yang dipakai:

`index.html?cabang=denpasar&ref=rd-dps-01`

Kode `ref` mengacu ke `sales.json`; nomor WhatsApp tidak diambil dari parameter URL. Ada dua sales dummy per cabang. Ganti nomor, nama, dan status `active` pada file tersebut untuk memakai data asli. Sales pertama tiap cabang pada `branches.json` menjadi tujuan default pengunjung tanpa referral.

Link referral valid memilih cabang dan mempertahankan sales pada formulir pembelian tunai dan kredit. Tombol WhatsApp umum juga mengikuti referral. Pilihan cabang pengiriman dan metode pembiayaan tidak mengganti sales dari referral. Referral tetap dibawa ke halaman cabang pada domain yang sama dan disimpan selama 30 hari di browser yang sama. Link referral baru yang valid mengganti referral sebelumnya. Kode yang tidak dikenal tidak dipakai sebagai nomor WhatsApp dan kembali ke pemilihan cabang manual.

Ketika penyimpanan browser dibatasi, referral dari URL tetap berfungsi saat halaman dibuka, serta diteruskan melalui link internal. Pengunjung yang menghapus penyimpanan atau beralih browser/perangkat perlu membuka link referral kembali. Implementasi ini untuk website statis; pencatatan komisi atau atribusi yang harus tahan manipulasi membutuhkan validasi server dan basis data.

`financing.json` berisi contoh DP, bunga flat per bulan, serta tenor. Seluruh skema masih dummy dan bukan ketentuan resmi penyedia. Nominal simulasi belum mencakup biaya tambahan. Estimasi pengiriman menggunakan titik dummy cabang yang dipilih.
