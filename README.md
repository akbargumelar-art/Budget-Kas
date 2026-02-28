# Catatan Keuangan - Aplikasi Pelacak Keuangan (Production Ready)

Aplikasi web responsif untuk pencatatan keuangan pribadi, dirancang dengan pendekatan mobile-first. Versi ini telah di-upgrade untuk siap produksi dengan frontend React (dibangun dengan Vite) dan backend Node.js/Express yang terhubung ke database MySQL.

## Struktur Proyek
Proyek ini dibagi menjadi dua bagian utama:
- **Frontend (root directory `/`):** Aplikasi React yang dibuat dengan Vite.
- **Backend (`/server` directory):** Server API Node.js/Express.

Setiap bagian memiliki `package.json`-nya sendiri untuk mengelola dependensi.

## Fitur
- **Frontend Modern:** Dibuat dengan React, TypeScript, dan Vite untuk pengalaman pengembangan yang cepat.
- **Backend Kuat:** Node.js/Express dengan koneksi ke database MySQL yang efisien.
- **Database Persisten:** Semua data disimpan di MySQL.
- **Peran Pengguna:** Akses Admin dan Viewer dengan hak yang berbeda.
- **CRUD Lengkap:** Admin dapat mengelola transaksi, anggaran, dompet, kategori, dan pengguna.
- **Siap Produksi:** Instruksi lengkap untuk membangun aplikasi frontend dan menjalankannya dengan server backend di VPS.

## Prasyarat
- [Node.js](https://nodejs.org/) (versi 18.x atau lebih tinggi).
- [MySQL Server](https://dev.mysql.com/downloads/mysql/).
- `mysql` command line client (untuk setup awal).

---

## Menjalankan dalam Mode Pengembangan (Development)

Untuk pengembangan, Anda akan menjalankan server frontend dan backend secara terpisah di dua terminal.

### Langkah 1: Setup Backend
1.  Buka terminal pertama, masuk ke direktori server:
    ```bash
    cd server
    ```
2.  Install dependensi backend:
    ```bash
    npm install
    ```
3.  Ikuti instruksi di bagian **"Setup Database & .env"** di bawah ini.
4.  Setelah database dan `.env` siap, jalankan server backend dalam mode "dev" (dengan hot-reloading):
    ```bash
    npm run dev
    ```
    Server backend akan berjalan di `http://localhost:5001`. Biarkan terminal ini tetap berjalan.

### Langkah 2: Setup Frontend
1.  Buka terminal kedua, pastikan Anda berada di direktori **root** proyek.
2.  Install dependensi frontend:
    ```bash
    npm install
    ```
3.  Jalankan server pengembangan frontend Vite:
    ```bash
    npm run dev
    ```
    Server frontend akan berjalan di port lain (biasanya `http://localhost:5173`).
4.  Buka browser Anda dan kunjungi URL yang diberikan oleh Vite. Aplikasi frontend akan secara otomatis terhubung ke backend API di port 5001.

---

## Deploy ke Produksi di VPS

### Langkah 1: Setup Database & `.env`
1.  Pastikan Anda sudah membuat database di server MySQL Anda.
    ```sql
    CREATE DATABASE Kas_Ciraya;
    ```
2.  Di root direktori proyek, buat file baru bernama `.env`. Salin konten dari `.env.example` ke dalamnya.
3.  Ubah nilai di dalam `.env` agar sesuai dengan konfigurasi database MySQL Anda di VPS.
    ```env
    DB_HOST=localhost
    DB_USER=your_db_user
    DB_PASSWORD=your_db_password
    DB_DATABASE=Kas_Ciraya
    DB_PORT=3306
    PORT=5001
    ```
4.  Jalankan skrip SQL untuk membuat tabel dan mengisi data awal. Dari direktori **root**, jalankan:
    ```bash
    # Ganti [USERNAME] dengan username MySQL Anda
    mysql -u [USERNAME] -p Kas_Ciraya < database.sql
    ```

### Langkah 2: Install Dependensi
1.  Di direktori **root**, install dependensi frontend:
    ```bash
    npm install
    ```
2.  Masuk ke direktori **server**, install dependensi backend:
    ```bash
    cd server
    npm install
    ```

### Langkah 3: Build Aplikasi Frontend
1.  Kembali ke direktori **root**.
2.  Jalankan perintah build. Perintah ini akan meng-compile semua file React/TSX menjadi file statis (HTML, JS, CSS) di dalam folder `dist`.
    ```bash
    npm run build
    ```

### Langkah 4: Jalankan Server Produksi
1.  Masuk ke direktori **server**.
2.  Jalankan server dalam mode produksi. Sangat disarankan menggunakan process manager seperti `pm2`.
    
    **Dengan PM2 (Direkomendasikan):**
    ```bash
    # Install pm2 jika belum ada: npm install -g pm2
    # Perintah ini menjalankan skrip 'start' dari package.json
    pm2 start npm --name "budget-kas" -- start
    ```

    **Tanpa PM2 (Dasar):**
    ```bash
    npm start
    ```
Server akan berjalan di port 5001, menyajikan API di `/api` dan semua file dari folder `dist`. Sekarang aplikasi Anda sudah live!