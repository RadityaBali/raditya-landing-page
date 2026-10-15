#!/usr/bin/env python3
"""Generate public branch and editorial pages from shared data. No server dependency."""
from pathlib import Path
from html import escape as esc
from urllib.parse import quote
import json

ROOT = Path(__file__).resolve().parents[1]
config = json.loads((ROOT / 'site-config.json').read_text())
branches = json.loads((ROOT / 'branches.json').read_text())
sales = json.loads((ROOT / 'sales.json').read_text())
origin = config['publicUrl'].rstrip('/')
indexed = []
slugs = {'buleleng': 'singaraja', 'jembrana': 'negara'}
intro = {
'denpasar': 'Dari perjalanan kerja hingga aktivitas harian di Denpasar, kenali pilihan sepeda dan motor listrik bersama tim Raditya. Mulai dari kebutuhan Anda, lalu diskusikan model yang sesuai.',
'badung': 'Kenali pilihan mobilitas listrik untuk rutinitas Anda di Badung. Tim Raditya membantu membahas kebutuhan perjalanan, model kendaraan, dan rencana pembelian Anda.',
'gianyar': 'Temukan pilihan sepeda dan motor listrik untuk keseharian Anda di Gianyar. Pelajari spesifikasi dari katalog pusat, lalu lanjutkan konsultasi bersama tim cabang.',
'tabanan': 'Mulai perjalanan mengenal EV bersama Raditya Tabanan. Diskusikan rute harian, kebutuhan baterai, dan kenyamanan berkendara sebelum menentukan pilihan.',
'buleleng': 'Untuk Anda di Singaraja dan wilayah Buleleng, kenali pilihan kendaraan listrik bersama Raditya. Temukan model dari katalog pusat dan konsultasikan kebutuhan Anda dengan tim cabang.',
'jembrana': 'Jelajahi pilihan mobilitas listrik bersama Raditya untuk Anda di Negara dan wilayah Jembrana. Mulai dengan mengenali kendaraan, lalu rencanakan kunjungan bersama tim cabang.',
'karangasem': 'Kenali kendaraan listrik untuk keseharian Anda di Karangasem. Ceritakan kebutuhan perjalanan dan karakter rute kepada tim Raditya agar konsultasi lebih terarah.',
'klungkung': 'Jelajahi pilihan sepeda dan motor listrik bersama Raditya Klungkung. Tim cabang membantu menjelaskan model, proses pembelian, dan rencana kunjungan Anda.',
'bangli': 'Mulai mengenal pilihan EV bersama Raditya Bangli. Bandingkan spesifikasi kendaraan dan diskusikan kebutuhan daya serta rute harian Anda sebelum membeli.'}
for b in branches:
    b.setdefault('slug', slugs.get(b['id'], b['id']))
    b['website'] = '/cabang/' + b['slug'] + '/'
    b.setdefault('intro', intro[b['id']])
(ROOT / 'branches.json').write_text(json.dumps(branches, ensure_ascii=False, indent=2) + '\n')

def wa(text, phone=None):
    return 'https://wa.me/' + (phone or config['centralWhatsapp']) + '?text=' + quote(text)

def primary_phone(branch):
    return next((s['whatsapp'] for s in sales if s['branchId'] == branch['id'] and s['active']), config['centralWhatsapp']) if branch else config['centralWhatsapp']

def catalog(b=None, category='motor'):
    return '/?'+('cabang='+b['id']+'&amp;' if b else '')+'kategori='+category+'#kategori'

def context():
    # Branch/contact routing remains active without an extra status panel.
    return ''

def directory(exclude=None):
    return '<nav class="network-directory" aria-label="Jaringan cabang">'+''.join(f'<a href="{b["website"]}">Raditya {esc(b.get("mapLabel",b["region"]))} ↗</a>' for b in branches if b['id'] != exclude)+'</nav>'

def shell(path, title, description, content, branch=None, preview=False):
    can_index = config['publishReady'] and not preview
    if can_index: indexed.append(path)
    schema = {'@context':'https://schema.org','@type':'WebPage','name':title,'url':origin+path,'description':description,'inLanguage':'id'}
    if branch and can_index:
        schema = {'@context':'https://schema.org','@type':'LocalBusiness','name':branch['name'],'url':origin+path,'address':{'@type':'PostalAddress','streetAddress':branch['address'],'addressLocality':branch['region'],'addressRegion':'Bali','addressCountry':'ID'},'geo':{'@type':'GeoCoordinates','latitude':branch['coordinates'][0],'longitude':branch['coordinates'][1]},'parentOrganization':{'@type':'Organization','name':config['name'],'url':origin}}
        phone = next((s['whatsapp'] for s in sales if s['branchId']==branch['id'] and s['active'] and not s['isDummy']),None)
        if phone: schema['telephone']='+'+phone
    branch_attr = f' data-branch-id="{branch["id"]}"' if branch else ''
    cat = catalog(branch)
    banner = '<div class="public-preview"><div class="wrap">Pratinjau jaringan Raditya Bali · Kontak, titik cabang, dan ketersediaan produk perlu dikonfirmasi.</div></div>' if preview else ''
    page = f'''<!DOCTYPE html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>{esc(title)}</title><meta name="description" content="{esc(description,quote=True)}"><meta name="robots" content="{'index,follow' if can_index else 'noindex,follow'}"><link rel="canonical" href="{origin+path}"><meta property="og:title" content="{esc(title,quote=True)}"><meta property="og:description" content="{esc(description,quote=True)}"><meta property="og:type" content="website"><meta property="og:url" content="{origin+path}"><meta property="og:image" content="{origin}/image/bg-hero.webp"><link rel="icon" href="/image/favicon.png"><link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"><link rel="stylesheet" href="/network.css?v=introduction-3"><link rel="stylesheet" href="/branch-site.css?v=network-1"><script type="application/ld+json">{json.dumps(schema,ensure_ascii=False).replace('<','\\u003c')}</script></head><body class="public-page"{branch_attr}>
<header class="public-header"><div class="wrap"><a class="public-brand" href="/"><img src="/image/Logo-Raditya-Putih.webp" alt="" width="38" height="38"><span>RADITYA BALI<small>ELECTRIC &amp; LIFESTYLE</small></span></a><nav class="public-nav" aria-label="Navigasi utama"><a data-catalog-link href="{cat}">Produk</a><a href="/cabang/">Cabang</a><a href="/panduan/">Panduan EV</a><a class="nav-contact" href="{wa('Halo Raditya Bali, saya ingin konsultasi pilihan kendaraan listrik.', primary_phone(branch))}" target="_blank" rel="noopener noreferrer">Konsultasi ↗</a></nav></div></header>{banner}<main>{content}</main><footer class="public-footer"><div class="wrap"><div><strong>RADITYA BALI</strong><br>Energi baru untuk perjalanan dan kehidupan Anda.<br>© 2026 Raditya Bali</div><div class="public-footer-links"><a href="/tentang-kami/">Tentang kami</a><a href="/cabang/">Semua cabang</a><a href="/panduan/">Panduan EV</a><a href="/">Beranda pusat ↗</a></div></div></footer><script src="/referral.js?v=network-1" defer></script><script src="/branch-distance.js" defer></script><script src="/contact-routing.js?v=network-1" defer></script><script src="/contact-router.js?v=network-1" defer></script></body></html>'''
    target = ROOT / path.strip('/') / 'index.html'
    target.parent.mkdir(parents=True,exist_ok=True)
    target.write_text(page)

def crumbs(label, parent=None):
    middle = f'<li><a href="/{parent[0]}/">{parent[1]}</a></li><li aria-hidden="true">/</li>' if parent else ''
    return f'<div class="wrap"><ol class="public-breadcrumb" aria-label="Jejak halaman"><li><a href="/">Beranda</a></li><li aria-hidden="true">/</li>{middle}<li aria-current="page">{esc(label)}</li></ol></div>'

models=[('Saige Latte','sepeda','sepeda listrik/saige latte.png','Ringkas untuk mengenali mobilitas listrik dalam aktivitas sekitar.'),('Maka Cavalry','motor','motor listrik/maka cavalry.png','Kenali spesifikasi motor listrik untuk kebutuhan perjalanan harian.'),('Vinfast Evo','motor','motor listrik/vinfast evo.png','Bandingkan pilihan baterai dan karakter kendaraan sebelum membeli.')]

def product_cards(b):
    return '<div class="network-grid">'+''.join(f'<article class="branch-product"><div class="branch-product-image"><img src="/image/image%20produk/{quote(image)}" alt="{name}" loading="lazy"></div><div class="branch-product-info"><span>{"SEPEDA" if category=="sepeda" else "MOTOR"} LISTRIK</span><h3>{name}</h3><p>{copy}</p><a class="network-link" data-catalog-link href="{catalog(b,category)}">Lihat spesifikasi &amp; harga ↗</a></div></article>' for name,category,image,copy in models)+'</div>'

for b in branches:
    region = esc(b.get('mapLabel',b['region']))
    path = b['website']
    address = esc(b['address'])
    hours = esc(b.get('hours','Jam operasional: konfirmasikan kepada tim cabang.'))
    title = f'Raditya {b.get("mapLabel",b["region"])} — Sepeda & Motor Listrik di {b["region"]}, Bali'
    description = f'Kenali Raditya {b.get("mapLabel",b["region"])}: pilihan sepeda listrik, motor listrik, elektronik, informasi lokasi, dan konsultasi pembelian di {b["region"]}, Bali.'
    hero = crumbs('Raditya '+b.get('mapLabel',b['region']),('cabang','Cabang'))+f'''<section class="branch-hero-v2"><div class="wrap network-split"><div><span class="network-eyebrow">JARINGAN RADITYA BALI / {region}</span><h1>Energi baru.<br>Lebih dekat di<br><em>{region}.</em></h1><p class="network-copy">{esc(b['intro'])}</p><div class="network-actions"><a class="network-button" data-catalog-link href="{catalog(b)}">Jelajahi kendaraan ↗</a><a class="network-button secondary" href="{wa('Halo Raditya Bali, saya ingin konsultasi kendaraan untuk wilayah '+b['region']+'.', primary_phone(b))}" target="_blank" rel="noopener noreferrer">Konsultasi pilihan saya</a></div><div class="branch-category-tags"><span>Sepeda listrik</span><span>Motor listrik</span><span>Elektronik rumah</span></div></div><div class="branch-hero-visual"><span>RADITYA / ELECTRIC MOBILITY</span><img src="/image/image%20produk/motor%20listrik/maka%20cavalry.png" alt="Motor listrik Maka Cavalry" width="500" height="300" fetchpriority="high"><strong>Perjalanan Anda, dimulai di sini.</strong></div></div></section>'''
    products=f'''<section class="network-section" id="produk"><div class="wrap"><div class="network-head"><div><span class="network-eyebrow">JELAJAHI KATALOG PUSAT</span><h2 class="network-title">Temukan kendaraan<br>untuk keseharian Anda.</h2></div><p class="network-copy">Pilihan model dari katalog Raditya Bali. Stok, warna, unit pajangan, dan harga akhir di {region} dikonfirmasi bersama tim cabang.</p></div>{product_cards(b)}<div class="network-actions"><a class="network-button secondary" data-catalog-link href="{catalog(b,'sepeda')}">Semua sepeda listrik ↗</a><a class="network-button secondary" data-catalog-link href="{catalog(b,'motor')}">Semua motor listrik ↗</a></div></div></section>'''
    service=f'''<section class="network-section alt"><div class="wrap"><div class="network-head"><div><span class="network-eyebrow">BERSAMA TIM {region}</span><h2 class="network-title">Bantu Anda memilih.<br>Dari awal hingga jelas.</h2></div></div><div class="network-grid"><article class="network-card"><span class="network-number">01</span><h3>Konsultasi kendaraan</h3><p>Ceritakan jarak perjalanan, kebutuhan baterai, dan rutinitas Anda. Bandingkan model sebelum menentukan pilihan.</p></article><article class="network-card"><span class="network-number">02</span><h3>Pilihan pembelian</h3><p>Lihat harga cash atau simulasi kredit di katalog. Ketersediaan metode serta persetujuan pembiayaan dikonfirmasi sales.</p></article><article class="network-card"><span class="network-number">03</span><h3>Rencana pengiriman</h3><p>Sampaikan alamat tujuan untuk mengecek jangkauan layanan, cabang pengiriman, biaya, dan estimasi waktu.</p></article></div></div></section>'''
    directions='https://www.google.com/maps/dir/?api=1&destination='+quote(','.join(str(x) for x in b['coordinates']))
    location=f'''<section class="network-section" id="lokasi"><div class="wrap"><span class="network-eyebrow">RENCANAKAN KUNJUNGAN</span><h2 class="network-title">Sampai jumpa<br>di {region}.</h2><div class="branch-visit"><div class="branch-visit-copy"><h3>{esc(b['name'])}</h3><address>{address}</address><p class="hours">{hours}</p><div class="network-actions"><a class="network-button" href="{directions}" target="_blank" rel="noopener noreferrer">Petunjuk arah ↗</a></div><a class="branch-specific-contact" data-contact-branch="{b['id']}" href="{wa('Halo tim Raditya '+b['region']+', saya ingin konfirmasi alamat, jam buka, dan ketersediaan unit untuk kunjungan.', primary_phone(b))}" target="_blank" rel="noopener noreferrer">Hubungi tim cabang {region} ↗</a><p class="branch-mini-note">{'Titik peta dan kontak masih data contoh. Konfirmasikan alamat serta jadwal sebelum berkunjung.' if b['isPreview'] else 'Konfirmasikan ketersediaan model sebelum berkunjung.'}</p></div><div class="branch-visit-map"><img src="/image/bali-branch-map.png" alt="Peta Bali, jaringan cabang Raditya" loading="lazy"><div class="branch-visit-label">⌖ Raditya {region} · {esc(b['region'])}, Bali</div></div></div></div></section>'''
    faq=f'''<section class="network-section alt"><div class="wrap network-split"><div><span class="network-eyebrow">SEBELUM BERKUNJUNG</span><h2 class="network-title">Yang sering<br>ditanyakan.</h2><p class="network-copy">Tim cabang membantu memastikan informasi sesuai dengan pilihan model dan kebutuhan Anda.</p><a class="network-link" href="/panduan/sebelum-ke-showroom/">Panduan kunjungan showroom ↗</a></div><div class="branch-faq"><details><summary>Apakah semua model tersedia di {region}?</summary><p>Katalog menampilkan pilihan produk Raditya Bali. Hubungi tim {region} untuk memastikan stok, warna, harga akhir, dan unit yang dapat dilihat langsung.</p></details><details><summary>Bisakah membeli cash atau kredit?</summary><p>Buka katalog lalu pilih Beli Sekarang. Anda dapat memilih pembayaran cash atau melihat simulasi kredit. Simulasi saat ini menggunakan ketentuan contoh; program resmi dan persyaratan perlu dikonfirmasi kepada sales.</p></details><details><summary>Apakah tersedia test ride dan servis?</summary><p>Tanyakan terlebih dahulu ketersediaan unit test ride, jadwal, dan lokasi layanan untuk model yang Anda minati. Fasilitas dapat berbeda menurut cabang dan merek.</p></details><details><summary>Bagaimana dengan elektronik rumah tangga?</summary><p>Anda tetap dapat berkonsultasi tentang televisi, kulkas, mesin cuci, dan AC melalui tim Raditya. Model serta ketersediaan dikonfirmasi sebelum pemesanan.</p></details></div></div></section>'''
    electronics=f'''<section class="network-section"><div class="wrap"><div class="network-home"><div><span class="network-eyebrow">RADITYA UNTUK RUMAH ANDA</span><h2 class="network-title">Kenyamanan yang<br>melengkapi keseharian.</h2><p class="network-copy">Selain kendaraan listrik, jelajahi pilihan kebutuhan elektronik rumah dan konsultasikan bersama tim {region}.</p><div class="network-actions"><a class="network-button secondary" data-catalog-link href="{catalog(b,'elektronik')}">Jelajahi elektronik ↗</a></div></div><img src="/image/elektronik/elektronik.svg" alt="Ilustrasi elektronik rumah tangga" loading="lazy"></div></div></section>'''
    links=f'<section class="network-section alt"><div class="wrap"><span class="network-eyebrow">SATU JARINGAN, LEBIH DEKAT</span><h2 class="network-title">Temukan cabang lainnya.</h2>{directory(b["id"])}</div></section>'
    shell(path,title,description,hero+context()+products+service+location+faq+electronics+links,b,b['isPreview'])

cards=''.join(f'<article class="directory-card"><span class="network-eyebrow">{esc(b["region"])}</span><h2>Raditya {esc(b.get("mapLabel",b["region"]))}</h2><p>{esc(b["address"])}</p><a class="network-link" href="{b["website"]}">Kenali cabang ↗</a></article>' for b in branches)
shell('/cabang/','Jaringan Cabang Raditya Bali — Temukan Cabang Anda','Temukan sembilan halaman cabang Raditya Bali, informasi lokasi, katalog EV, dan konsultasi sales.',crumbs('Jaringan cabang')+'<section class="network-section"><div class="wrap"><span class="network-eyebrow">JARINGAN RADITYA BALI</span><h1 class="network-title">Satu Raditya.<br>Dekat di berbagai wilayah Bali.</h1><p class="network-copy">Pilih cabang untuk mengenal pilihan kendaraan, lokasi, dan tim yang membantu Anda. Data cabang masih dalam tahap pratinjau.</p><div class="network-actions"><a class="network-button secondary" href="/#cabang">Lihat peta Bali ↗</a></div></div></section>'+context()+'<section class="network-section alt"><div class="wrap network-grid">'+cards+'</div></section>',preview=True)

guides=[
('memilih-kendaraan-listrik','Sepeda atau motor listrik: mulai dari kebutuhan Anda.','MULAI MENGENAL EV','Memilih kendaraan menjadi lebih mudah ketika Anda mulai dari aktivitas sehari-hari, bukan hanya tampilan atau angka spesifikasi.',[
('Ceritakan rutinitas Anda','Catat tujuan perjalanan yang paling sering Anda datangi, jarak pulang-pergi, kondisi rute, dan kebutuhan membawa barang. Informasi ini membantu sales menjelaskan pilihan model yang relevan.'),
('Bandingkan kenyamanan, bukan hanya angka','Perhatikan ukuran kendaraan, posisi duduk, tinggi pijakan, ruang penyimpanan, dan kemudahan memindahkannya saat parkir. Tanyakan ketersediaan unit yang dapat dilihat atau dicoba di cabang.'),
('Kenali baterai dan tempat mengisi','Tanyakan jenis baterai, apakah dapat dilepas, perkiraan waktu pengisian, serta kebutuhan pengisi daya. Cocokkan dengan tempat penyimpanan dan rutinitas pengisian Anda.'),
('Siapkan daftar pertanyaan','Diskusikan harga akhir, kelengkapan kendaraan, ketentuan penggunaan model, dokumen, garansi, dan layanan perawatan. Pastikan penjelasan yang Anda terima mengacu pada model yang benar.')]),
('baterai-dan-pengisian','Kenali baterai dan rutinitas pengisiannya.','KESEHARIAN BERSAMA EV','Baterai dan cara pengisian merupakan bagian penting dari pengalaman memakai kendaraan listrik. Kenali petunjuk model Anda sebelum digunakan.',[
('Tanyakan karakter baterai model Anda','Kapasitas, jenis baterai, sistem pelepasan, dan pilihan jumlah baterai berbeda menurut model. Mintalah penjelasan sesuai varian yang hendak dibeli.'),
('Susun rutinitas yang masuk akal','Diskusikan berapa lama pengisian menurut petunjuk produsen dan di mana kendaraan akan disimpan. Perkiraan waktu dapat dipengaruhi kondisi baterai serta sistem pengisian.'),
('Gunakan petunjuk resmi sebagai acuan','Gunakan pengisi daya yang sesuai rekomendasi produsen dan ikuti panduan mengenai kondisi tempat pengisian. Jika ada masalah pada baterai atau pengisi daya, hubungi layanan yang sesuai mereknya.'),
('Pahami angka jarak tempuh','Angka spesifikasi merupakan acuan dengan kondisi pengujian tertentu. Beban, rute, kecepatan, kondisi baterai, dan cara berkendara dapat memengaruhi hasil pemakaian sehari-hari.')]),
('sebelum-ke-showroom','Siapkan kunjungan Anda ke showroom.','KUNJUNGAN YANG LEBIH TERARAH','Sebelum berangkat, hubungi cabang yang ingin Anda kunjungi. Tim dapat membantu mengonfirmasi alamat, jadwal, dan model yang tersedia.',[
('Pilih dua atau tiga model','Buka katalog pusat, catat model beserta varian yang menarik, lalu sampaikan kepada tim cabang. Ketersediaan katalog tidak berarti setiap unit selalu ada di setiap showroom.'),
('Konfirmasikan agenda kunjungan','Tanyakan jam buka, unit pajangan, dan kemungkinan test ride beserta ketentuannya. Jika Anda membutuhkan informasi servis, sebutkan merek dan model kendaraan.'),
('Bahas pembelian secara lengkap','Minta rincian harga, kelengkapan, garansi, dan biaya pengiriman bila diperlukan. Untuk pembiayaan, minta penjelasan ketentuan resmi serta biaya yang berlaku sebelum membuat keputusan.'),
('Simpan informasi cabang','Buka halaman cabang untuk melihat alamat dan tombol petunjuk arah. Sampaikan kebutuhan khusus sebelum datang agar tim dapat membantu menyiapkan informasi yang relevan.')])]
for slug,title,eyebrow,intro_text,sections in guides:
    body=crumbs('Panduan EV',('panduan','Panduan'))+f'<div class="wrap"><article class="public-article"><span class="network-eyebrow">{eyebrow}</span><h1>{title}</h1><p class="article-intro">{intro_text}</p>'+''.join(f'<h2>{heading}</h2><p>{text}</p>' for heading,text in sections)+f'<div class="article-callout"><h2 style="margin-top:0">Diskusikan pilihan Anda.</h2><p>Tim Raditya membantu menjelaskan model dan rencana pembelian sesuai kebutuhan Anda.</p><a class="network-button" href="{wa("Halo Raditya Bali, saya ingin konsultasi setelah membaca panduan EV.")}" target="_blank" rel="noopener noreferrer">Konsultasi dengan sales ↗</a></div><a class="network-link" href="/panduan/">← Semua panduan EV</a></article></div>'+context()
    shell('/panduan/'+slug+'/',title+' — Raditya Bali',intro_text,body)
cards=''.join(f'<a class="network-guide-card" href="/panduan/{slug}/"><span>{eyebrow}</span><h3>{title}</h3><p>{intro_text}</p><span>Baca panduan ↗</span></a>' for slug,title,eyebrow,intro_text,_ in guides)
shell('/panduan/','Panduan Kendaraan Listrik — Raditya Bali','Kenali pilihan kendaraan listrik, baterai, dan persiapan kunjungan showroom bersama Raditya Bali.',crumbs('Panduan EV')+'<section class="network-section"><div class="wrap"><span class="network-eyebrow">MULAI DARI RASA INGIN TAHU</span><h1 class="network-title">Lebih kenal EV.<br>Lebih yakin memilih.</h1><p class="network-copy">Panduan singkat untuk membantu Anda bertanya, membandingkan, dan merencanakan pembelian.</p><div class="network-grid" style="margin-top:32px">'+cards+'</div></div></section>')
shell('/tentang-kami/','Tentang Raditya Bali — Electric & Lifestyle','Kenali arah baru Raditya Bali dalam mobilitas listrik dan kebutuhan elektronik rumah tangga.',crumbs('Tentang Raditya')+'''<div class="wrap"><article class="public-article"><span class="network-eyebrow">ELECTRIC &amp; LIFESTYLE</span><h1>Babak baru Raditya.<br>Lebih dekat dengan keseharian Anda.</h1><p class="article-intro">Raditya Bali menghadirkan pilihan sepeda listrik, motor listrik, dan elektronik rumah tangga dalam satu jaringan.</p><h2>Selamat datang di perjalanan yang baru.</h2><p>Perubahan kebutuhan mengajak kita untuk terus bergerak. Melalui pilihan kendaraan listrik, Raditya Bali ingin membantu Anda mengenal bentuk mobilitas yang baru dengan informasi yang mudah dipahami.</p><p>Tim kami mendampingi proses mengenali model, membandingkan kebutuhan, serta membahas pembelian dan layanan yang relevan. Kebutuhan elektronik rumah tangga tetap menjadi bagian dari layanan Raditya.</p><h2>Satu jaringan, pengalaman yang terhubung.</h2><p>Jelajahi katalog dari website pusat dan lanjutkan konsultasi bersama cabang yang sesuai. Jika Anda datang melalui link sales, pendamping tersebut tetap terhubung selama Anda memilih produk dan merencanakan pembelian.</p><h2>Informasi yang membantu Anda memilih.</h2><p>Kami mengajak Anda memahami spesifikasi, pengisian baterai, garansi, dan ketersediaan layanan sebelum membeli. Tim cabang membantu mengonfirmasi informasi sesuai merek, model, dan kebutuhan Anda.</p><div class="article-callout"><p>Selamat menjelajahi pilihan Anda.<br><strong>Tim Raditya Bali</strong></p></div><a class="network-button" href="/cabang/">Kenali jaringan cabang ↗</a></article></div>'''+context())
# Add crawlable branch links to the illustrated map; keep the map itself unchanged.
index_path=ROOT/'index.html'
index=index_path.read_text()
start='<!-- NETWORK DIRECTORY START -->';end='<!-- NETWORK DIRECTORY END -->'
block=start+'\n'+directory()+'\n'+end
if start in index:
    a=index.index(start);z=index.index(end,a)+len(end);index=index[:a]+block+index[z:]
else:
    marker='<section id="layanan"'
    boundary=index.rfind('</div>\n</section>',0,index.index(marker))
    index=index[:boundary]+block+'\n'+index[boundary:]
import re
index=re.sub(r'<meta name="robots" content="[^"]+">','<meta name="robots" content="'+('index,follow' if config['publishReady'] else 'noindex,follow')+'">',index,count=1)
if '<link rel="canonical"' not in index:index=index.replace('</head>',f'<link rel="canonical" href="{origin}/">\n</head>',1)
index_path.write_text(index)
if config['publishReady']:indexed.insert(0,'/')
(ROOT/'sitemap.xml').write_text('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join(f'  <url><loc>{esc(origin+path)}</loc></url>\n' for path in indexed)+'</urlset>\n')
(ROOT/'robots.txt').write_text('User-agent: *\nAllow: /\nSitemap: '+origin+'/sitemap.xml\n')
print(f'Generated {len(branches)} branch pages, directory, 3 guides, guide index, and company page. Publish ready: {config["publishReady"]}.')
