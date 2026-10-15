# Referral sales Raditya Bali

Buka `referral-links.html` untuk membuat link setiap sales. Link baru langsung menuju halaman cabang, misalnya:

`/cabang/denpasar/?cabang=denpasar&ref=rd-dps-02`

Link lama `index.html?cabang=denpasar&ref=rd-dps-02` dan `cabang.html?cabang=denpasar&ref=rd-dps-02` tetap didukung.

Kode `ref` dicocokkan dengan sales aktif dalam `sales.json`; nomor WhatsApp tidak diterima dari parameter URL. Ada dua sales dummy untuk setiap cabang.

Referral valid mempertahankan sales pendamping pada tombol konsultasi umum serta pembelian cash/kredit. Mengubah cabang pengiriman tidak mengubah referral. Link referral valid yang baru mengganti referral sebelumnya; kode eksplisit tidak dikenal menghapus referral sebelumnya lalu menggunakan konteks cabang yang tersedia. Referral disimpan 30 hari pada browser yang sama dan dibawa melalui link internal.

Tanpa referral, kontak mengikuti halaman cabang, pilihan manual, atau lokasi terdekat. Tombol yang secara eksplisit menyebut cabang tetap menghubungi cabang tersebut. Aturan lengkap dan panduan publikasi ada di `SITE-NETWORK.md`.

Atribusi ini berlangsung di browser. Pencatatan komisi, kepemilikan calon pelanggan, dan laporan penjualan yang tahan manipulasi membutuhkan validasi server dan basis data.

Skema di `financing.json` masih contoh, bukan ketentuan resmi penyedia. Estimasi pengiriman memakai titik cabang dummy. Konfirmasikan data sebelum publikasi.
