# Aura — Pendamping Refleksi Kerja (Frontend MVP)

Pendamping refleksi harian untuk pekerja perusahaan: catat hari kerjamu lewat tulisan atau check-in 30 detik, pantau dinamika beban dari hari ke hari, dan dapatkan satu langkah kecil yang masuk akal.

> **Catatan Penggunaan & Klaim Jujur**:
> Aura dirancang berdasarkan prinsip jeda singkat (micro-break) dan detasemen psikologis dari kerja. Aura **bukan alat diagnosis medis atau klinis**, bukan terapi, dan bukan alat penilaian kinerja karyawan. Skor beban harian dan indeks burnout 7 hari adalah heuristik pola catatan refleksi, bukan instrumen psikometri klinis tervalidasi.

---

## 1. Menjalankan Aplikasi

Aplikasi dibangun dengan **React + TypeScript + Vite** menggunakan CSS variables murni tanpa library UI atau chart eksternal.

```bash
# Menjalankan development server
npm run dev

# Kompilasi build produksi
npm run build

# Validasi type checking
npm run lint
```

Aplikasi berjalan di port `3000`.

---

## 2. Fitur yang Dibangun

### Tier P0 (Fondasi Utama Karyawan)
- **Login Simulasi**: Akses cepat dengan akun contoh (29 hari data realistis) atau akun pengguna baru (data kosong).
- **Home**: Salam dinamis waktu, karakter Companion zona, skor Indeks Burnout 7 hari (tabular-nums), Zone Pill, kalimat tren, tombol utama "Tulis jurnal hari ini", tombol sekunder "Check-in cepat", dan mini chart solid 7 hari.
- **Tulis Jurnal**: Textarea besar auto-grow, penghitung karakter (maks 2000), deteksi kata kunci pemicu beban, dan layar Companion berpikir (*thinking* mode).
- **Check-in Cepat (30 Detik, F3)**: Pemisahan stres mental (1-5) dan energi fisik (1-5), jam tidur, serta pemicu utama.
- **Layar Hasil (Momen Wow)**: Count-up indeks (~1200ms), Companion berubah bentuk & warna zona, validasi empatik, chip pemicu, kartu saran, dan rekomendasi latihan mikro.
- **Tren Beban**: Segmented control 7 / 30 hari, grafik SVG garis ganda solid (beban harian tipis & indeks tebal), latar pita zona tint solid, dan paragraf insight mingguan.
- **Care Mode (Prioritas Keselamatan)**: Terbuka otomatis jika terdeteksi sinyal krisis atau via tautan "Butuh bicara dengan seseorang?". Tanpa skor atau nada produktivitas. Dilengkapi kontak darurat terverifikasi dan tombol WhatsApp langsung ke kontak tepercaya.
- **Latihan Mikro Berpanduan Visual (F1)**:
  - Layar persiapan sebelum mulai & konfirmasi keluar.
  - Visual per jenis langkah:
    - `breath`: Lingkaran membesar, menahan, dan mengecil dengan penghitung waktu akurat (`performance.now`) dan putaran.
    - `tap_count`: Titik sentuh (minimal 44px) terisi solid per ketukan (5-4-3-2-1).
    - `pose`: Companion dengan rig lengan berpose (`neck_left`, `neck_right`, `arms_up`, `stand`, `sit`).
    - `timer`: Hitung mundur besar tabular-nums.
    - `write`: Area tulis memori saja (disclaimer: *Tulisan ini tidak disimpan*).
  - Kontrol: Sebelumnya (dengan pelestarian progres), Jeda/Lanjutkan, dan Lanjut/Selesai. Dukungan keyboard (Panah Kiri, Kanan, Spasi).

### Tier Wajib Lomba: Dasbor HRD Agregat (F12)
- **Login HRD Khusus**: Rute `/hrd` dengan validasi email kerja dan role guard (karyawan tidak bisa membuka dasbor HRD, HRD tidak bisa membuka halaman pribadi karyawan).
- **Banner Privasi Permanen**: Menegaskan seluruh data bersifat agregat dan tanpa nama, serta angka hanya muncul jika dihitung dari minimal 5 orang.
- **Filter Divisi**: Semua divisi, Marketing, IT, Sales, Operasional, Divisi lain (digabung), serta opsi pengujian "Tim Khusus (< 5 orang)" untuk menguji mekanisme proteksi ambang privasi (*suppression state*).
- **Grafik Tren Indeks 12 Bulan**: Grafik garis solid dengan pita zona dan legenda.
- **Heatmap Hari Paling Sering Berat**: Kalender 4 minggu x 7 hari dengan 4 tingkat solid netral berbasis *ink* (tanpa gradasi) dan persentase tertulis.
- **Diagram Donut Pemicu Utama**: Irisan solid netral dengan persentase dan jumlah laporan (n).
- **Saran Tindakan HRD**: Rekomendasi otomatis berbasis data divisi tanpa menyalahkan manajer.

### Tier P1 & P2
- **Tindak Lanjut Latihan (F2)**: Kartu feedback 1-5 di Beranda untuk latihan kemarin dengan tombol "Lewati" setara.
- **Peta Pemicu (F4)**: Bar horizontal solid *ink* dengan persentase dan jumlah (n).
- **Kontak Tepercaya (F5)**: Menyimpan nama, relasi, dan nomor WhatsApp orang terdekat dengan tautan pesan siap kirim di Care Mode.
- **Jeda & Batas Kerja (F6)**: Pengaturan jam selesai kerja dan pilihan 1-3 ritual penutup.
- **Pemecah Tugas Besar (F7)**: Memecah tugas menjadi langkah 15 menit dengan checklist dan timer fokus.
- **Dokumen Cetak & Ringkasan Konselor (F8 & F9)**: Menggunakan `@media print` murni untuk format A4 potret tanpa library eksternal. Mode konselor dan mode salinan data saya.
- **Pengingat Lembut (F10)**:
  - Notifikasi browser lokal (dengan tombol "Tes pengingat").
  - Kalender `.ics` dibuat di sisi klien dengan aturan perulangan VEVENT & VALARM.
  - Penjelasan jujur mengenai batas teknis frontend-only.
- **Tema Terang, Gelap, & Otomatis (F11)**: Pergantian tema instan dengan CSS variables dan pencegahan kedipan (*flash*) di `<head>`.
- **Riwayat Catatan**: Daftar kronologis per tanggal dengan titik zona dan modal detail.
- **Landing Page Editorial**: Halaman sambutan dengan 3 langkah sederhana dan disclaimer.

---

## 3. Skenario Uji & Cara Memicunya di Mock Data

1. **Skenario Normal (Calm / Watch / Heavy)**:
   - Pilih "Muat data contoh 30 hari" di layar Login untuk melihat riwayat 29 hari yang lengkap dengan variasi beban kerja.
2. **Skenario Pengguna Baru (Kosong)**:
   - Pilih "Coba sebagai pengguna baru (data kosong)" di layar Login. Beranda dan Tren akan menampilkan tampilan kosong dengan ajakan bertindak yang ramah.
3. **Memicu Skenario Error**:
   - Ketik `#error` di teks jurnal pada halaman Tulis Jurnal. Sistem akan menampilkan pesan penanganan error: *"Ada kendala sebentar saat menganalisis jurnal. Coba lagi ya."* dengan tombol coba lagi tanpa menghapus teks.
4. **Memicu Skenario Krisis (Crisis Flag)**:
   - Tulis kalimat eksplisit seperti *"ingin mengakhiri hidup"* atau *"tidak sanggup hidup lagi"*. Sistem akan langsung mengabaikan skor beban dan mengarahkan pengguna ke **Care Mode**.
5. **Memicu Skenario Ambang Privasi HRD (< 5 Orang)**:
   - Masuk ke Dasbor HRD, lalu pada dropdown divisi pilih **"Tim Khusus (< 5 orang)"**. Dasbor akan menampilkan status *suppressed* bahwa data disembunyikan demi menjaga privasi tim.
6. **Uji Pengingat & Notifikasi**:
   - Buka Pengaturan > Pengingat > klik tombol **"Tes pengingat sekarang"** untuk meminta izin browser dan melihat simulasi notifikasi lokal tanpa kata burnout.
   - Klik **"Tambahkan ke kalender (.ics)"** untuk mengunduh berkas kalender siap impor.

---

## 4. Token Desain & Anti-Slop Discipline

- **Warna Solid**: Latar terang `#F6F4EF`, permukaan `#FFFFFF`, teks `#1A1A1A`. Latar gelap `#141414`, permukaan `#1C1C1C`, teks `#F2F2F2`.
- **Status Zona**:
  - Tenang (0-39): Solid `#3F8F6B`, Tint terang `#E6F2EC`, Tint gelap `#1B2F26`.
  - Waspada (40-69): Solid `#D99A1E`, Tint terang `#FBF1DC`, Tint gelap `#3A2F14`.
  - Butuh istirahat (70-100): Solid `#C84B4B`, Tint terang `#F8E4E4`, Tint gelap `#3A1E1E`.
- **Zero-Gradient Rule**: Tidak ada gradasi linear, radial, mesh, text gradient, atau chart gradient.
- **Tipografi**: Plus Jakarta Sans, `tabular-nums` untuk angka.
- **Radius**: Hanya 2 nilai: `12px` (kartu & input) dan `999px` (tombol & pill).

---

## 5. Rencana Integrasi Backend & AI Pasca-MVP

- **Backend & Database**: Penegakan ambang batas agregasi minimal 5 orang di tingkat database server (bukan hanya klien), otentikasi sesi JWT/OAuth, dan isolasi data pengguna.
- **Gemini AI**: Pemanggilan model Gemini secara server-side melalui endpoint proxy `/api/journal`. API key tidak pernah diletakkan di kode frontend. Penilaian skor dan indeks tetap dihitung deterministik oleh kode rumus agar konsisten dan objektif.
- **Web Push Server**: Pengiriman notifikasi saat aplikasi tertutup melalui protokol Web Push (VAPID) dan service worker push event.
