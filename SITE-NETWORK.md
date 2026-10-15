# Raditya Bali: pusat dan seluruh cabang

## Yang tersedia

Satu website statis dan satu katalog pembelian bersama. Beranda berisi hero EV, pemilih cabang, panduan kebutuhan, katalog, sambutan transformasi, pengenalan EV, alur pembelian, peta Bali, layanan purnajual, elektronik, panduan, dan FAQ.

Halaman cabang memiliki isi HTML langsung, judul/deskripsi unik, canonical, foto produk, katalog pusat, alamat/jam buka, kontak cabang, petunjuk arah, FAQ, dan tautan jaringan.

| Wilayah | URL | ID data |
| --- | --- | --- |
| Denpasar | /cabang/denpasar/ | denpasar |
| Badung | /cabang/badung/ | badung |
| Gianyar | /cabang/gianyar/ | gianyar |
| Tabanan | /cabang/tabanan/ | tabanan |
| Singaraja | /cabang/singaraja/ | singaraja |
| Negara | /cabang/negara/ | negara |
| Karangasem | /cabang/karangasem/ | karangasem |
| Klungkung | /cabang/klungkung/ | klungkung |

Direktori: `/cabang/`. Informasi perusahaan: `/tentang-kami/`. Tiga artikel pengenalan EV: `/panduan/`.
Link lama `cabang.html?cabang=...&ref=...` tetap diarahkan ke halaman baru dengan referral yang sama.

## Pengelolaan konten

- `branches.json`: identitas, slug, pengantar, alamat, jam buka (opsional), koordinat, posisi peta Bali, status pratinjau.
- `sales.json`: kontak sales aktif. Sales aktif pertama dalam setiap cabang menjadi kontak utama; berikutnya menjadi cadangan jika yang pertama nonaktif. Nomor tidak diambil langsung dari query URL.
- `site-config.json`: nama, domain produksi, admin pusat, dan kesiapan publikasi.
- `scripts/build-site.py`: template halaman cabang, perusahaan, dan artikel. Jalankan `python3 scripts/build-site.py` setelah memperbarui data cabang atau template. Halaman HTML hasilnya dapat disajikan oleh hosting statis biasa.
- Katalog, harga, dan spesifikasi masih memakai sumber katalog yang sudah ada di `index.html`. Ketersediaan stok belum tersambung ke sistem inventori.

Sambutan ditulis atas nama Tim Raditya Bali. Tidak ada nama pimpinan, angka pengalaman, foto toko, promo, atau stok yang dibuat-buat.

## Aturan kontak

1. Referral valid (URL atau tersimpan 30 hari) menentukan sales pendamping.
2. Tanpa referral, cabang dari URL/halaman menentukan kontak awal.
3. Pilihan cabang manual mengganti konteks pelayanan dan disimpan selama 30 hari. Reload mengikuti pilihan tersebut.
4. Lokasi terdekat digunakan jika tidak ada pilihan eksplisit/manual. Pilihan lokasi disimpan maksimal 1 hari; koordinat pengguna tidak disimpan.
5. Tanpa konteks, tombol konsultasi umum menuju admin pusat.

Tombol yang secara eksplisit menyebut cabang, misalnya “Hubungi tim cabang Gianyar”, selalu menuju cabang tersebut. Tombol konsultasi umum mengikuti aturan di atas.

Pengiriman dan atribusi sales terpisah: referral Denpasar dapat memakai pengiriman dari Singaraja tanpa memindahkan sales pendamping. Formulir cash/kredit, asal pengiriman, dan tombol WhatsApp diperbarui bersama pilihan cabang.

Browser hanya menggunakan lokasi otomatis jika izin lokasi sudah diberikan. Jika belum, pengguna menekan tombol pencarian lokasi. Penolakan, waktu habis, dan lokasi yang tidak tersedia ditangani dengan pilihan manual. Jarak menggunakan garis lurus dan titik cabang saat ini masih contoh.

## SEO dan publikasi

Seluruh halaman saat ini merupakan pratinjau (`publishReady: false`) dan `noindex,follow`. Ini sengaja menjaga data dummy agar tidak masuk hasil pencarian sebagai data bisnis nyata. Sitemap baru berisi halaman yang sudah boleh diindeks saat publikasi diaktifkan.

Untuk publikasi:
1. Konfirmasi domain produksi di `site-config.json`.
2. Isi alamat, koordinat, jam buka, nomor sales, dan informasi layanan yang benar.
3. Ubah `isPreview` menjadi false hanya untuk cabang yang datanya sudah diverifikasi, serta `isDummy` menjadi false untuk nomor sales asli.
4. Set `publishReady: true`, kemudian jalankan generator. Cabang yang masih preview tetap noindex dan tidak dimasukkan ke sitemap; cabang terverifikasi mendapat structured data LocalBusiness.
5. Deploy seluruh file ke domain, hubungkan Google Business Profile tiap cabang ke URL cabang terkait, lalu kirim sitemap melalui Search Console.

Implementasi tidak mengakses akun Google atau melakukan deployment publik. SEO tidak menjamin peringkat tertentu.

## Batas tahap ini

Ini adalah fondasi website publik yang berfungsi, bukan dashboard admin. Belum tersedia login/otorisasi pusat-cabang, database calon pelanggan, stok real-time, pembagian sales bergilir, pencatatan penjualan/komisi, atau laporan konversi. Fitur tersebut memerlukan backend dan aturan bisnis perusahaan. Jangan menyimpan data pribadi pelanggan atau rahasia dalam file JSON publik.

## Verifikasi

`node tests/contact-routing.test.cjs` menguji prioritas referral, pilihan manual/halaman/lokasi, masa berlaku, sales nonaktif, serta semua 8 cabang. Browser juga memverifikasi tujuan WhatsApp tiap halaman, alur cabang ke katalog, dan perubahan cabang pengiriman tanpa mengganti referral. Tidak ada pesan WhatsApp dikirim selama pengujian.
