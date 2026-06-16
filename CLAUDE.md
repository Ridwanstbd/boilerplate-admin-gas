# CLAUDE.md — Boilerplate Admin Google Apps Script

Dokumen ini adalah panduan teknis lengkap proyek **boilerplate-admin-gas** untuk digunakan bersama Claude AI. Berisi konteks arsitektur, tutorial setup, konvensi kode, dan panduan pengembangan fitur baru.

---

## Daftar Isi

1. [Gambaran Proyek](#1-gambaran-proyek)
2. [Arsitektur & Struktur File](#2-arsitektur--struktur-file)
3. [Sistem Middleware Auth](#3-sistem-middleware-auth)
4. [Tutorial Setup dari Nol](#4-tutorial-setup-dari-nol)
5. [Alur Kerja Database](#5-alur-kerja-database)
6. [Alur Autentikasi](#6-alur-autentikasi)
7. [Konvensi Kode](#7-konvensi-kode)
8. [Menambah Fitur Baru](#8-menambah-fitur-baru)
9. [Troubleshooting](#9-troubleshooting)
10. [Batasan & Catatan GAS](#10-batasan--catatan-gas)

---

## 1. Gambaran Proyek

Proyek ini adalah **boilerplate aplikasi admin** yang berjalan sepenuhnya di atas ekosistem Google: Google Apps Script (GAS) sebagai backend, Google Spreadsheet sebagai database, dan HTML/CSS/JS vanilla sebagai frontend.

Tidak ada server eksternal, tidak ada biaya hosting. Semua berjalan di infrastruktur Google.

**Stack Teknologi:**

- **Runtime:** Google Apps Script V8 (JavaScript ES6+)
- **Database:** Google Spreadsheet (setiap sheet = satu tabel)
- **Frontend:** HTML + CSS + JavaScript vanilla (disajikan via `HtmlService`)
- **Session:** `PropertiesService.getUserProperties()` sebagai penyimpanan session server-side
- **Keamanan:** SHA-256 hashing via `Utilities.computeDigest`
- **Deploy Tool:** `clasp` (Google's CLI untuk GAS)

**Kapabilitas Saat Ini:**

- Proteksi route server-side: `doGet()` menentukan halaman yang dirender berdasarkan status session
- Verifikasi session dua lapis: server (doGet) + client (DOMContentLoaded)
- Middleware auth dengan dukungan role-based access control (RBAC)
- Session otomatis kedaluwarsa setelah 8 jam
- Login, registrasi admin, logout dengan redirect aman
- Hashing password SHA-256 (tidak ada plain-text yang tersimpan)
- Migrasi dan seeding database otomatis

---

## 2. Arsitektur & Struktur File

```
boilerplate-admin-gas/
│
├── Backend (.gs) ─────────────────────────────────────────────
│   ├── middleware.auth.gs     ← BARU: session create/destroy/guard
│   ├── app.controller.gs      ← Entry point: doGet() dengan route guard
│   ├── app.helper.gs          ← BARU: getWebAppUrl() untuk client redirect
│   ├── auth.controller.gs     ← API bridge: login, register, logout, checkSession
│   ├── auth.service.gs        ← Business logic: login sekarang buat session
│   ├── user.repository.gs     ← Data access: baca/tulis sheet Users
│   ├── utils.crypto.gs        ← SHA-256, validasi kekuatan password
│   └── setup.database.gs      ← Migrasi & seeder schema database
│
├── Frontend — Halaman Publik (belum login) ───────────────────
│   ├── index.public.html      ← BARU: shell untuk halaman login/register
│   ├── view.login.html        ← Form login (dipisah dari register)
│   ├── view.register.html     ← BARU: form register (file terpisah)
│   ├── styles.auth.html       ← BARU: CSS khusus halaman auth
│   └── scripts.auth.html      ← BARU: JS login, register, switchAuthView
│
├── Frontend — Halaman App (sudah login) ──────────────────────
│   ├── index.app.html         ← BARU: shell untuk halaman dalam app
│   ├── view.dashboard.html    ← BARU: layout sidebar + dashboard + placeholder pages
│   ├── styles.app.html        ← BARU: CSS sidebar, topbar, card, stats
│   └── scripts.app.html       ← BARU: JS navigasi, verifikasi session, logout
│
├── Shared ─────────────────────────────────────────────────────
│   └── styles.base.html       ← BARU: CSS variables, reset, utility classes
│
└── Config ─────────────────────────────────────────────────────
    └── appsscript.json        ← Runtime V8, timezone, akses web app
```

### Alur Request Lifecycle

```
Browser mengakses URL Web App
          │
          ▼
   app.controller.gs
   doGet()
          │
          ├─ AuthMiddleware.requireAuth()
          │       │
          │       ├─ PropertiesService.getUserProperties()
          │       ├─ Cek keberadaan session key
          │       └─ Cek expiry (8 jam)
          │
          ├─ Session VALID?
          │       ├─ YA  → render index.app.html  (dashboard)
          │       └─ TIDAK → render index.public.html (login)
          │
          ▼
   HtmlService merender template
   (include() menyisipkan styles + views + scripts)
          │
          ▼
   Browser menerima HTML lengkap
          │
          ├─ Jika index.app.html:
          │     DOMContentLoaded → apiCheckSession()
          │     Session tidak valid → redirect ke URL web app
          │
          └─ Jika index.public.html:
                User mengisi form → google.script.run.apiLoginUser()
                Login berhasil → AuthMiddleware.createSession()
                               → redirect ke URL web app
                               → doGet() sekarang render index.app.html
```

---

## 3. Sistem Middleware Auth

### File: `middleware.auth.gs`

Middleware menggunakan **IIFE (Immediately Invoked Function Expression)** untuk enkapsulasi, mengekspos hanya public API yang diperlukan.

```javascript
var AuthMiddleware = (function () {
  // Semua implementasi tersembunyi di dalam closure
  // ...
  return { createSession, destroySession, getSession, requireAuth, requireRole };
})();
```

### Session Storage

Session disimpan di `PropertiesService.getUserProperties()` — penyimpanan key-value per akun Google yang menjalankan script. Data bersifat persisten hingga dihapus secara eksplisit atau kedaluwarsa.

| Key | Isi |
|-----|-----|
| `session_email` | Email user yang login |
| `session_role` | Role user (`"admin"`, dll.) |
| `session_created_at` | Timestamp Unix saat login (milidetik) |

### Durasi Session

Session berlaku **8 jam** sejak login. Setiap pemanggilan `requireAuth()` atau `getSession()` mengecek selisih waktu antara `session_created_at` dan waktu saat ini. Jika melebihi 8 jam, session dihapus otomatis dan mengembalikan `null`.

Untuk mengubah durasi, edit konstanta di `middleware.auth.gs`:

```javascript
var SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // ganti angka pertama (8 = jam)
```

### Public API Middleware

```javascript
// Buat session baru setelah login berhasil
AuthMiddleware.createSession(email, role)

// Hapus session saat logout
AuthMiddleware.destroySession()

// Ambil data session. Return null jika tidak ada atau kedaluwarsa
AuthMiddleware.getSession()
// → { email: string, role: string } | null

// Guard: pastikan user sudah login
AuthMiddleware.requireAuth()
// → { authorized: true, session: {...} }
// → { authorized: false, message: "..." }

// Guard: pastikan user login DAN memiliki role tertentu
AuthMiddleware.requireRole("admin")
AuthMiddleware.requireRole(["admin", "superadmin"])
// → { authorized: true, session: {...} }
// → { authorized: false, message: "Akses ditolak..." }
```

### Penggunaan di Controller

Setiap controller yang mengakses data sensitif harus memanggil guard sebelum melakukan operasi:

```javascript
function apiGetSensitiveData() {
  try {
    // Guard: hanya user yang login
    var auth = AuthMiddleware.requireAuth();
    if (!auth.authorized) {
      return { success: false, message: auth.message };
    }

    // Guard: hanya role tertentu
    var roleCheck = AuthMiddleware.requireRole(["admin", "superadmin"]);
    if (!roleCheck.authorized) {
      return { success: false, message: roleCheck.message };
    }

    // Aman untuk dilanjutkan
    return { success: true, data: getSomeData() };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
```

### Proteksi Dua Lapis

Sistem menggunakan dua lapisan proteksi yang saling melengkapi:

**Lapis 1 — Server (`doGet`):** User yang belum login tidak pernah menerima HTML halaman app. `doGet()` selalu memeriksa session sebelum menentukan template yang dikirim ke browser. Ini mencegah akses langsung ke URL web app.

**Lapis 2 — Client (`DOMContentLoaded`):** Saat `index.app.html` dimuat, `scripts.app.html` langsung memanggil `apiCheckSession()`. Jika session ternyata sudah kedaluwarsa di tengah sesi browsing (misalnya tab dibiarkan terbuka lama), user otomatis diredirect ke halaman login.

---

## 4. Tutorial Setup dari Nol

### Prasyarat

- Akun Google aktif
- Node.js terinstal (versi 14 ke atas)
- `clasp` terinstal secara global

```bash
npm install -g @google/clasp
```

### Langkah 1 — Login clasp ke Akun Google

```bash
clasp login
```

Browser akan terbuka untuk otorisasi. Setelah selesai, token tersimpan di `~/.clasprc.json`.

### Langkah 2 — Buat Google Sheet Baru

Buka [sheets.google.com](https://sheets.google.com) dan buat spreadsheet baru. Catat URL-nya, karena ID spreadsheet ada di URL:

```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_ADA_DI_SINI/edit
```

### Langkah 3 — Buat Project Apps Script yang Terikat ke Sheet

Masuk ke sheet tersebut, lalu klik menu **Extensions > Apps Script**. Editor GAS akan terbuka. Catat **Script ID** dari URL editor:

```
https://script.google.com/home/projects/SCRIPT_ID_ADA_DI_SINI/edit
```

### Langkah 4 — Clone & Hubungkan Proyek

```bash
git clone https://github.com/Ridwanstbd/boilerplate-admin-gas.git
cd boilerplate-admin-gas

# Buat file .clasp.json dengan Script ID yang dicatat tadi
echo '{"scriptId":"GANTI_DENGAN_SCRIPT_ID_KAMU","rootDir":"."}' > .clasp.json
```

### Langkah 5 — Push Kode ke Apps Script

```bash
clasp push
```

Jika ada konfirmasi overwrite, ketik `y`. Semua file `.gs` dan `.html` akan diunggah ke GAS editor.

### Langkah 6 — Jalankan Migrasi Database

Di GAS editor:

1. Pilih fungsi `runMigrate` dari dropdown di toolbar
2. Klik tombol **▶ Run**
3. Beri izin akses saat diminta: klik **Review Permissions → Allow**
4. Cek tab **Execution Log** — harus muncul: `[MIGRATE] Tabel 'Users' berhasil dibuat.`

Kemudian jalankan seeder:

1. Pilih fungsi `runSeeder` → klik **▶ Run**
2. Log harus muncul: `[SEED] Berhasil menambahkan data dummy ke tabel 'Users'.`

> **Kredensial default:** `admin@example.com` / `Admin123!`
> Ganti password ini segera setelah deploy pertama.

### Langkah 7 — Deploy sebagai Web App

Di GAS editor:

1. Klik **Deploy → New deployment**
2. Pilih type: **Web app**
3. **Execute as:** `Me` (akun yang memiliki spreadsheet)
4. **Who has access:** sesuaikan kebutuhan (`Anyone` untuk publik)
5. Klik **Deploy** → salin **Web App URL**

Buka URL tersebut. Jika belum ada session aktif → halaman login tampil. Setelah login berhasil → redirect otomatis ke halaman dashboard.

### Langkah 8 — Update Kode (Iterasi Berikutnya)

```bash
clasp push
# Untuk testing gunakan URL /dev (selalu kode terbaru, hanya pemilik)
# Untuk production buat New Deployment baru
```

---

## 5. Alur Kerja Database

### Schema Saat Ini

Sheet **Users** memiliki kolom berikut:

| Kolom | Tipe | Keterangan |
|-------|------|------------|
| ID | UUID string | Primary key, dibuat dengan `Utilities.getUuid()` |
| Email | String | Unik, disimpan lowercase |
| PasswordHash | String | SHA-256 hex dari password asli |
| Role | String | Nilai: `"admin"` |
| Created_At | Date | Timestamp saat row dibuat |

### Menambah Tabel Baru

Edit property `this.schema` di constructor `DatabaseMigration` pada `setup.database.gs`:

```javascript
this.schema = {
  Users:    ["ID", "Email", "PasswordHash", "Role", "Created_At"],
  Products: ["ID", "Name", "Price", "Stock", "Created_At"], // tambahkan di sini
};
```

Jalankan `runMigrate()` lagi — sheet yang sudah ada tidak terhapus, hanya kolom baru yang ditambahkan.

### Fungsi Database yang Tersedia

```javascript
runMigrate()              // Buat sheet baru sesuai schema (aman, tidak hapus data)
runSeeder()               // Isi data awal (hanya jalan jika sheet kosong)
runRefreshAndSeed()       // Reset total + migrate + seed (⚠️ HAPUS SEMUA DATA)
runRollbackSpecificTable() // Hapus satu tabel (default: "Users")
```

---

## 6. Alur Autentikasi

### Registrasi

```
handleRegister() di browser
  → validasi konfirmasi password (client)
  → google.script.run.apiRegisterAdmin(email, pass)
      → AuthService.register()
          → CryptoUtils.isPasswordStrong()  [validasi regex]
          → UserRepository.findByEmail()    [cek duplikasi]
          → CryptoUtils.hashSHA256(pass)    [hash password]
          → UserRepository.create()         [simpan ke sheet]
      → { success: true, message }
  → tampil pesan sukses → switchAuthView('login-view')
```

### Login

```
handleLogin() di browser
  → google.script.run.apiLoginUser(email, pass)
      → AuthService.login()
          → UserRepository.findByEmail()    [cari user]
          → CryptoUtils.hashSHA256(pass)    [hash input]
          → bandingkan hash                 [validasi]
          → AuthMiddleware.createSession()  [simpan session]
      → { success: true, email, role }
  → google.script.run.getWebAppUrl()
  → window.top.location.href = url          [reload → doGet]
      → AuthMiddleware.requireAuth()        [session valid]
      → render index.app.html
```

### Logout

```
handleLogout() di browser
  → google.script.run.apiLogout()
      → AuthService.logout()
          → AuthMiddleware.destroySession() [hapus session]
      → { success: true }
  → google.script.run.getWebAppUrl()
  → window.top.location.href = url          [reload → doGet]
      → AuthMiddleware.requireAuth()        [session null]
      → render index.public.html            [kembali ke login]
```

### Aturan Validasi Password

Password harus memenuhi semua syarat (divalidasi di `utils.crypto.gs`):

- Minimal 8 karakter
- Minimal 1 huruf kecil (`a-z`)
- Minimal 1 huruf besar (`A-Z`)
- Minimal 1 angka (`0-9`)
- Minimal 1 simbol dari set: `@$!%*?&#`

---

## 7. Konvensi Kode

### Penamaan File

| Tipe | Pola | Contoh |
|------|------|--------|
| Middleware | `middleware.[nama].gs` | `middleware.auth.gs` |
| Controller | `[domain].controller.gs` | `auth.controller.gs` |
| Service | `[domain].service.gs` | `auth.service.gs` |
| Repository | `[domain].repository.gs` | `user.repository.gs` |
| Utility | `utils.[nama].gs` | `utils.crypto.gs` |
| Helper (app-level) | `app.[nama].gs` | `app.helper.gs` |
| Shell publik | `index.public.html` | — |
| Shell app | `index.app.html` | — |
| View (auth) | `view.[nama].html` | `view.login.html` |
| View (app) | `view.[nama].html` | `view.dashboard.html` |
| Style shared | `styles.base.html` | — |
| Style per-konteks | `styles.[konteks].html` | `styles.auth.html`, `styles.app.html` |
| Script per-konteks | `scripts.[konteks].html` | `scripts.auth.html`, `scripts.app.html` |

### Pola Controller dengan Guard

Semua controller yang mengakses data di balik login harus memanggil guard di baris pertama:

```javascript
function apiContohDilindungi() {
  try {
    var auth = AuthMiddleware.requireAuth();
    if (!auth.authorized) return { success: false, message: auth.message };

    // Aksi yang dilindungi di sini
    return { success: true, data: getSesuatu() };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
```

### Pola Middleware IIFE

Middleware ditulis sebagai IIFE untuk menghindari polusi scope global GAS:

```javascript
var NamaMiddleware = (function () {
  // Variabel privat — tidak bisa diakses dari luar
  var _privateVar = "nilai";

  function _privateHelper() { /* ... */ }

  function publicMethod() {
    return _privateHelper();
  }

  return { publicMethod };
})();
```

### Pola Repository

```javascript
class NamaRepository {
  constructor() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("Spreadsheet tidak ditemukan.");
    this.sheet = ss.getSheetByName("NamaTabel");
    if (!this.sheet) throw new Error("Tabel 'NamaTabel' belum dibuat. Jalankan runMigrate().");
  }
  findAll()         { /* ambil semua baris */ }
  findById(id)      { /* cari by kolom ID */ }
  create(data)      { /* appendRow */ }
  update(id, data)  { /* cari row lalu setValue */ }
  delete(id)        { /* cari row lalu deleteRow */ }
}
```

### Pola Frontend Client-Side

```javascript
// Selalu sertakan withFailureHandler
google.script.run
  .withSuccessHandler(function (res) {
    if (res.success) { /* handle sukses */ }
    else             { _setMsg("msg-id", res.message, "error"); }
  })
  .withFailureHandler(function (err) {
    _setMsg("msg-id", "Kesalahan teknis: " + err.message, "error");
  })
  .namaFungsiController(param);
```

---

## 8. Menambah Fitur Baru

### Contoh: Menambah Halaman Produk

#### Langkah 1 — Tambah schema di `setup.database.gs`

```javascript
this.schema = {
  Users:    ["ID", "Email", "PasswordHash", "Role", "Created_At"],
  Products: ["ID", "Name", "Price", "Stock", "Created_At"],
};
```

Jalankan `runMigrate()`.

#### Langkah 2 — Buat `product.repository.gs`

```javascript
class ProductRepository {
  constructor() {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("Spreadsheet tidak ditemukan.");
    this.sheet = ss.getSheetByName("Products");
    if (!this.sheet) throw new Error("Tabel 'Products' belum dibuat.");
  }

  findAll() {
    return this.sheet.getDataRange().getValues().slice(1)
      .map(function (r) {
        return { id: r[0], name: r[1], price: r[2], stock: r[3] };
      });
  }

  create(p) {
    this.sheet.appendRow([Utilities.getUuid(), p.name, p.price, p.stock, new Date()]);
  }
}
```

#### Langkah 3 — Buat `product.service.gs`

```javascript
class ProductService {
  constructor() { this.repo = new ProductRepository(); }

  getAll()               { return { success: true, data: this.repo.findAll() }; }
  create(name, price, stock) {
    if (!name || !price) return { success: false, message: "Nama dan harga wajib diisi." };
    this.repo.create({ name, price: parseFloat(price), stock: parseInt(stock) || 0 });
    return { success: true, message: "Produk ditambahkan." };
  }
}
```

#### Langkah 4 — Buat `product.controller.gs`

```javascript
function apiGetProducts() {
  try {
    var auth = AuthMiddleware.requireAuth();           // ← wajib ada
    if (!auth.authorized) return { success: false, message: auth.message };
    return new ProductService().getAll();
  } catch (e) { return { success: false, message: e.message }; }
}

function apiCreateProduct(name, price, stock) {
  try {
    var auth = AuthMiddleware.requireAuth();           // ← wajib ada
    if (!auth.authorized) return { success: false, message: auth.message };
    return new ProductService().create(name, price, stock);
  } catch (e) { return { success: false, message: e.message }; }
}
```

#### Langkah 5 — Tambah nav item di `view.dashboard.html`

```html
<div class="nav-item" data-page="products" onclick="navigateTo('products')">
  <span class="nav-item__icon">📦</span>
  <span>Produk</span>
</div>
```

#### Langkah 6 — Tambah page di `view.dashboard.html`

```html
<div id="page-products" class="page-view hidden">
  <div class="card">
    <div class="card__header">
      <span class="card__title">📦 Produk</span>
      <button class="btn btn-primary" style="width:auto" onclick="loadProducts()">
        + Tambah
      </button>
    </div>
    <div class="card__body" id="products-container">
      <p style="color:var(--color-text-muted)">Memuat...</p>
    </div>
  </div>
</div>
```

#### Langkah 7 — Tambah handler di `scripts.app.html`

```javascript
function loadProducts() {
  google.script.run
    .withSuccessHandler(function (res) {
      var container = document.getElementById("products-container");
      if (!res.success) { container.innerHTML = "<p>" + res.message + "</p>"; return; }
      container.innerHTML = res.data.length
        ? res.data.map(function (p) {
            return "<p><strong>" + p.name + "</strong> — Rp" + p.price + "</p>";
          }).join("")
        : "<p style='color:var(--color-text-muted)'>Belum ada produk.</p>";
    })
    .withFailureHandler(function (err) { console.error(err.message); })
    .apiGetProducts();
}
```

#### Langkah 8 — Daftarkan page title di `navigateTo()` (`scripts.app.html`)

```javascript
var titles = {
  dashboard: "Dashboard",
  users:     "Manajemen Pengguna",
  products:  "Produk",       // ← tambahkan ini
  settings:  "Pengaturan",
};
```

---

## 9. Troubleshooting

### Error: "An unknown error has occurred" saat `runMigrate`

Script dijalankan dari Standalone Script, bukan dari dalam Google Sheet.

**Solusi:** Buka Google Sheet → **Extensions → Apps Script** → jalankan dari sana.

### Halaman login terus muncul setelah login berhasil

`PropertiesService` menyimpan session per user Google. Jika script dikonfigurasi `executeAs: USER_ACCESSING` (bukan `USER_DEPLOYING`), setiap user punya storage sendiri — ini perilaku yang benar.

Jika masalah terjadi untuk pemilik script sendiri, cek apakah `getWebAppUrl()` mengembalikan URL yang benar (bukan URL editor `/edit`).

### Error: "Cannot read properties of null" di repository

Sheet belum dibuat. Jalankan `runMigrate()` terlebih dahulu.

### Seeder tidak jalan (log: SKIP)

Seeder hanya berjalan jika sheet kosong (hanya header). Untuk reset total jalankan `runRefreshAndSeed()` — **ini menghapus semua data**.

### Perubahan tidak terlihat di web app

GAS deployment bersifat snapshot. Setelah `clasp push`:
- Testing: gunakan URL `…/dev` (selalu kode terbaru, hanya pemilik)
- Production: buat **New Deployment** baru

### Session tidak tersimpan antar request

`PropertiesService.getUserProperties()` bersifat per-user Google. Pastikan `executeAs` di `appsscript.json` di-set ke `USER_DEPLOYING` agar semua user berbagi storage yang sama (penyederhanaan), atau `USER_ACCESSING` agar tiap user punya session sendiri (lebih aman untuk multi-user).

---

## 10. Batasan & Catatan GAS

### Scope Global dan Urutan File

Semua file `.gs` berbagi satu scope global. Middleware ditulis sebagai IIFE (`var AuthMiddleware = (function(){...})()`) sehingga variabel internalnya tersembunyi, namun `AuthMiddleware` itu sendiri tersedia secara global. Hindari variabel di level atas file.

### PropertiesService: getUserProperties vs getScriptProperties

| | `getUserProperties` | `getScriptProperties` |
|---|---|---|
| Scope | Per user Google | Seluruh script (shared) |
| Kapasitas | 500 KB per user | 500 KB total |
| Digunakan untuk | Session per-user | Config global (API keys, dll.) |

Boilerplate ini menggunakan `getUserProperties` untuk session agar tiap akun Google memiliki session yang terisolasi.

### Tidak Ada Cookie atau JWT Asli

GAS `HtmlService` tidak mendukung cookie browser atau header HTTP kustom. Session diimplementasikan sepenuhnya via `PropertiesService` di sisi server.

### Redirect Setelah Login/Logout

GAS tidak mendukung server-side redirect (`302 Found`). Redirect dilakukan dari client dengan memanggil `getWebAppUrl()` lalu menetapkan `window.top.location.href`. Ini memaksa browser melakukan request baru ke `doGet()` dengan session yang sudah diperbarui.

### Batas Eksekusi

| Batasan | Nilai |
|---------|-------|
| Waktu eksekusi per fungsi | 6 menit |
| PropertiesService total | 500 KB per user |
| Jumlah properti | 500 properti per store |
| Quota baca/tulis Spreadsheet | ~20.000 operasi/hari (akun gratis) |

### Perintah clasp Berguna

```bash
clasp pull          # Tarik kode terbaru dari GAS ke lokal
clasp push          # Dorong kode lokal ke GAS
clasp push --watch  # Auto-push saat file berubah
clasp open          # Buka GAS editor di browser
clasp logs          # Lihat Stackdriver logs
clasp deployments   # Lihat daftar deployment
```

---

*Dokumen ini mencakup versi dengan middleware autentikasi server-side dan pemisahan struktur halaman publik/app.*