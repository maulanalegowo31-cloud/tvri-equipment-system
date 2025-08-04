# 📺 Sistem Pencatatan Alat Digital TVRI World

> **Sistem manajemen inventaris digital yang 100% gratis** untuk pencatatan peminjaman dan pengembalian alat produksi dan berita TVRI World. Terintegrasi dengan Google Spreadsheet untuk sinkronisasi real-time.

## 🚀 Quick Start - 100% Gratis!

### Mode Demo (Langsung Coba)
Sistem sudah siap dengan data demo - tidak perlu setup apapun!

### Mode Produksi (Setup 5 Menit)
1. **[Buat Google Spreadsheet](https://sheets.google.com)** - 1 menit
2. **[Setup Google Apps Script](https://script.google.com)** - 2 menit  
3. **Update konfigurasi** - 1 menit
4. **Deploy di Replit** - 1 menit

**→ [TUTORIAL INSTALASI LENGKAP](./TUTORIAL_INSTALASI.md) ←**

### Deploy Tanpa Replit
- 🌐 **[GitHub Pages, Netlify, Vercel](./DEPLOY_ALTERNATIF.md)** - Platform hosting gratis
- 🖥️ **[Server Sendiri](./DEPLOY_MANUAL.md)** - VPS, shared hosting, local server
- 📦 **[Download Package](./DOWNLOAD_PACKAGE.md)** - File siap deploy

## 💰 Biaya Total: Rp 0 (Nol Rupiah)

| Komponen | Platform | Biaya |
|----------|----------|-------|
| Frontend | HTML/CSS/JS | Gratis |
| Backend | Google Apps Script | Gratis |
| Database | Google Spreadsheet | Gratis |
| Hosting | Replit | Gratis |
| Domain | .replit.app | Gratis |

## 🌟 Fitur Utama

- **Peminjaman Real-time**: Formulir peminjaman dengan validasi dan update status otomatis
- **Pengembalian Otomatis**: Sistem pengembalian yang mengupdate status inventaris secara real-time
- **Dashboard Inventaris**: Tampilan status semua alat dengan filter dan pencarian
- **Integrasi Google Sheets**: Sinkronisasi data real-time dengan Google Spreadsheet
- **Cache Mechanism**: Sistem cache untuk performa optimal dan offline capability
- **Responsive Design**: Interface yang responsif untuk desktop dan mobile
- **Error Handling**: Sistem error handling yang komprehensif
- **Auto-refresh**: Update data otomatis setiap 30 detik

## 📋 Jenis Alat yang Didukung

- 📷 **Kamera** (Canon EOS, Sony A7, Nikon D850, dll)
- 💻 **Laptop** (MacBook Pro/Air, Dell XPS, ThinkPad, Surface, dll)  
- 📽️ **Proyektor** (Epson, BenQ, Sony VPL, Canon LV, dll)
- 🎤 **Mikrofon** (Shure SM58, Audio-Technica, Rode, Blue Yeti, dll)
- 🔊 **Speaker** (JBL, Bose, Harman Kardon, Sony, dll)
- 📱 **Tablet** (iPad Pro/Air, Samsung Galaxy Tab, Surface Pro, dll)
- 🖥️ **Monitor** (Dell UltraSharp, LG 4K, Samsung Odyssey, ASUS ProArt, dll)
- 🖨️ **Printer** (HP LaserJet, Canon Pixma, Epson EcoTank, Brother HL, dll)
- 🎬 **Lainnya** (Tripod Manfrotto, Gimbal DJI, Power Bank, External SSD, dll)

## 🔧 Kustomisasi Mudah

### Ubah Nama Organisasi
```html
<!-- Edit index.html -->
<h1>Sistem Pencatatan Alat Digital</h1>
<p>NAMA_ORGANISASI_ANDA - Unit Kerja</p>
```

### Tambah Equipment Baru
```csv
<!-- Tambah di Google Spreadsheet -->
Sony A7R IV,camera,TERSEDIA,Excellent
MacBook Pro 16,laptop,TERSEDIA,Good
```

## 🔍 Troubleshooting

### Masalah Umum
1. **Error CORS**: Re-deploy Google Apps Script dengan akses "Anyone"
2. **Data tidak tersimpan**: Cek permission spreadsheet harus "Editor"
3. **URL tidak dikonfigurasi**: Update `GAS_WEB_APP_URL` di config.js
4. **Loading lambat**: Set `DEMO_MODE: false` di config.js

### Mode Demo vs Produksi
| Fitur | Mode Demo | Mode Produksi |
|-------|-----------|---------------|
| Data | Sample offline | Google Spreadsheet |
| Persistence | Local browser | Cloud database |
| Sharing | Single user | Multi-user |
| Real-time | Simulasi | Aktual |

## 🏗️ Arsitektur Sistem

