# Admin Dashboard - Google Apps Script

Aplikasi dasbor admin berbasis Google Apps Script (GAS) dengan Google Spreadsheet sebagai _database_. Proyek ini dirancang menggunakan konsep arsitektur modular (mirip _Separation of Concerns_ MVC) untuk memisahkan lapisan UI, Controller, Service, dan Repository.

## Fitur Utama

- **Autentikasi Aman:** Registrasi dan login dengan validasi _password_ ketat.
- **Keamanan Hashing:** Menggunakan SHA-256 bawaan GAS (`Utilities.computeDigest`) sehingga _password_ tidak disimpan dalam bentuk _plain-text_.
- **Struktur Modular:** Pembagian logika bisnis, akses _database_, dan _frontend_ agar mudah di-_maintain_.

## Struktur Direktori (Modular)

Meskipun berjalan dalam lingkup global GAS, file dipisahkan dengan penamaan berikut:

**Backend (`.gs`)**

- `app.controller.gs`: _Entry point_ untuk merender UI (`doGet`) dan memuat _template_.
- `auth.controller.gs`: Penghubung yang dipanggil oleh _frontend_ (`google.script.run`).
- `auth.service.gs`: Memuat logika bisnis (validasi, registrasi, pengecekan _login_).
- `user.repository.gs`: Menangani operasi _read/write_ langsung ke Google Spreadsheet.
- `utils.crypto.gs`: Berisi fungsi statis untuk _hashing_ dan validasi _regex_.
- `setup.database.gs`: Skrip migrasi untuk membuat dan memformat _sheet_ "Users".

**Frontend (`.html`)**

- `index.html`: Kerangka dasar yang menyatukan semua komponen UI menggunakan _scriptlet_.
- `styles.html`: Berisi modul kode CSS.
- `scripts.html`: Berisi fungsi JavaScript untuk navigasi antar _view_ dan pemanggilan API ke _backend_.
- `view.login.html`: Komponen _view_ untuk halaman _login_.
- `view.register.html`: Komponen _view_ untuk halaman registrasi (jika dipisah).
- `view.dashboard.html`: Komponen _view_ untuk dasbor (jika dipisah).

## Cara Instalasi & Penggunaan

### Prasyarat

- Akun Google
- Instalasi Node.js dan `clasp` (`npm install -g @google/clasp`)

### 1. _Clone_ dan _Push_ ke Apps Script

1. _Login_ ke akun Google melalui terminal:
   ```bash
   clasp login
   ```
