# Cahaya Dakwah: prototipe web dakwah digital

Situs statis 5 halaman (tanpa build, tanpa npm). Semua yang interaktif sudah jalan.

## Cara membuka di VS Code

1. Ekstrak zip, lalu di VS Code pilih **File > Open Folder** dan buka folder `cahaya-dakwah`.
2. Pasang ekstensi **Live Server** (VS Code akan menawarkannya otomatis).
3. Klik kanan `index.html` > **Open with Live Server**.

Bisa juga langsung klik dua kali `index.html`. Koneksi internet hanya dipakai untuk memuat font Google.

## Isi folder

| File | Halaman |
| --- | --- |
| `index.html` | Beranda |
| `kajian.html` | Perpustakaan kajian (cari, saring, urutkan) |
| `putar.html` | Pemutar kajian (play, kecepatan, catatan) |
| `artikel.html` | Artikel dan berlangganan email |
| `donasi.html` | Formulir donasi (hanya tampilan, tidak ada pembayaran nyata) |
| `js/dc-lite.js` | Runtime kecil yang menjalankan templat `{{ }}`, `sc-if`, `sc-for`, dan event |

## Cara mengubah

- **Teks dan tampilan:** ubah langsung di bagian templat tiap file (di dalam `<template id="x-dc">`).
- **Data dan perilaku:** ubah di blok `<script type="text/x-dc">` pada akhir file (class `Component`, fungsi `renderVals()`).
- **Warna aksen emas:** nilai `default` pada `accent` di atribut `data-props` tiap halaman.
- **Placeholder:** semua teks dalam kurung siku, seperti `[Nama]`, `[Email kontak]`, dan `[Nomor WhatsApp]`, perlu diganti. Nama "Cahaya Dakwah" juga hanya contoh.

## Catatan

Ilustrasi masjid, bulan sabit, lampion, dan ikon topik adalah SVG buatan sendiri yang ada langsung di dalam HTML, jadi tidak ada file gambar yang perlu diunduh.
Untuk proyek sungguhan, langkah berikutnya biasanya memindahkan gaya inline ke file CSS dan data ke API atau file JSON.
