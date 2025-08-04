# 🚀 Quick Start Guide - Sistem Pencatatan Alat Digital TVRI

## 👀 Coba Langsung (30 Detik)

Sistem sudah siap digunakan dalam **mode demo** dengan data sample lengkap!

### 1. Buka Aplikasi
```
https://tvri-equipment-system.replit.app
```

### 2. Explore Fitur
- **Dashboard** → Lihat statistik inventaris
- **Status Inventaris** → Browse semua alat yang tersedia
- **Peminjaman Alat** → Coba pinjam equipment
- **Pengembalian Alat** → Test return process

### 3. Test Data
Gunakan data ini untuk test peminjaman:
```
Nama Peminjam: John Doe
Unit Kerja: Produksi
Keperluan: Testing System
```

---

## 🏗️ Setup Produksi (5 Menit)

### Langkah 1: Google Spreadsheet (1 menit)
1. Buka [Google Sheets](https://sheets.google.com)
2. Buat spreadsheet baru: **"TVRI Equipment Management"**
3. Copy ID dari URL (bagian setelah `/d/`)

### Langkah 2: Google Apps Script (2 menit)
1. Buka [Google Apps Script](https://script.google.com)
2. Buat project baru: **"TVRI Equipment API"**
3. Copy file dari folder `gas/` di project ini
4. Update `SPREADSHEET_ID` dengan ID dari langkah 1
5. Deploy sebagai Web App dengan akses "Anyone"

### Langkah 3: Update Config (1 menit)
```javascript
// Edit js/config.js
const CONFIG = {
    GAS_WEB_APP_URL: 'PASTE_URL_WEB_APP_DISINI',
    SPREADSHEET_ID: 'PASTE_ID_SPREADSHEET_DISINI',
    DEMO_MODE: false, // Ubah ke false
}
```

### Langkah 4: Deploy Replit (1 menit)
1. Klik "Run" untuk test
2. Klik "Deploy" untuk publikasi
3. Share URL ke tim Anda

---

## 📱 Fitur yang Bisa Dicoba

### Mode Demo
✅ Lihat inventaris 30+ alat sample  
✅ Pinjam dan kembalikan alat  
✅ Dashboard statistik real-time  
✅ Filter dan pencarian  
✅ Responsive mobile view  

### Mode Produksi
✅ Semua fitur demo +  
✅ Data tersimpan di Google Sheets  
✅ Multi-user collaboration  
✅ Data backup otomatis  
✅ Export ke Excel/PDF  

---

## ⚡ Tips Penggunaan

### Peminjaman Cepat
1. Pilih jenis alat dari dropdown
2. Equipment tersedia muncul otomatis
3. Isi data peminjam minimal
4. Submit → Status langsung update

### Dashboard Analytics
- **Hijau**: Equipment available
- **Merah**: Equipment sedang dipinjam  
- **Kuning**: Equipment perlu maintenance
- **Abu**: Equipment tidak aktif

### Mobile Friendly
- Semua fitur berfungsi di mobile
- Touch-friendly interface
- Swipe navigation antar tab
- Auto-save form data

---

## 🎯 Next Steps

### Untuk Testing
- Gunakan mode demo tanpa setup
- Test semua fitur dan alur kerja
- Feedback untuk improvement

### Untuk Produksi
- Follow [Tutorial Lengkap](./TUTORIAL_INSTALASI.md)
- Setup Google integration
- Customize untuk organisasi Anda
- Training team untuk penggunaan

---

## 📞 Butuh Bantuan?

### Quick Links
- 📖 [Tutorial Lengkap](./TUTORIAL_INSTALASI.md)
- 🔧 [Troubleshooting](./README.md#troubleshooting)
- 💬 [Report Issues](mailto:support@tvri.go.id)

### Common Issues
- **Demo tidak muncul data?** → Refresh browser
- **Form tidak bisa submit?** → Cek koneksi internet  
- **Status tidak update?** → Tunggu 30 detik auto-refresh

---

**🎉 Selamat mencoba! Sistem siap melayani kebutuhan inventaris TVRI World!**