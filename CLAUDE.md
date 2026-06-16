# CLAUDE.md — Boilerplate Admin Google Apps Script

Dokumen ini adalah panduan teknis lengkap proyek **boilerplate-admin-gas** untuk digunakan bersama Claude AI. Berisi konteks arsitektur, tutorial setup, konvensi kode, dan panduan pengembangan fitur baru.

---

## Daftar Isi

1. [Gambaran Proyek](#1-gambaran-proyek)
2. [Arsitektur & Struktur File](#2-arsitektur--struktur-file)
3. [Tutorial Setup dari Nol](#3-tutorial-setup-dari-nol)
4. [Alur Kerja Database](#4-alur-kerja-database)
5. [Alur Autentikasi](#5-alur-autentikasi)
6. [Konvensi Kode](#6-konvensi-kode)
7. [Menambah Fitur Baru](#7-menambah-fitur-baru)
8. [Troubleshooting](#8-troubleshooting)
9. [Batasan & Catatan GAS](#9-batasan--catatan-gas)

---

## 1. Gambaran Proyek

Proyek ini adalah **boilerplate aplikasi admin** yang berjalan sepenuhnya di atas ekosistem Google: Google Apps Script (GAS) sebagai backend, Google Spreadsheet sebagai database, dan HTML/CSS/JS vanilla sebagai frontend.

Tidak ada server eksternal, tidak ada biaya hosting. Semua berjalan di infrastruktur Google.

**Stack Teknologi:**

- **Runtime:** Google Apps Script V8 (JavaScript ES6+)
- **Database:** Google Spreadsheet (setiap sheet = satu tabel)
- **Frontend:** HTML + CSS + JavaScript vanilla (disajikan via `HtmlService`)
- **Keamanan:** SHA-256 hashing via `Utilities.computeDigest`
- **Deploy Tool:** `clasp` (Google's CLI untuk GAS)

**Kapabilitas Saat Ini:**

- Login admin dengan validasi kredensial
- Registrasi admin baru dengan validasi password ketat
- Hashing password sebelum disimpan (tidak ada plain-text)
- Migrasi dan seeding database otomatis
- Navigasi multi-view (login / register / dashboard) tanpa reload halaman

---

## 2. Arsitektur & Struktur File

Proyek mengikuti pola **MVC yang diadaptasi** untuk lingkungan GAS. Semua file `.gs` berjalan dalam satu scope global, sehingga urutan pemuatan file penting.

```
boilerplate-admin-gas/
│
├── Backend (.gs) ─────────────────────────────────
│   ├── app.controller.gs      # Entry point: doGet(), include()
│   ├── auth.controller.gs     # API bridge: dipanggil google.script.run
│   ├── auth.service.gs        # Business logic: register, login
│   ├── user.repository.gs     # Data access: baca/tulis sheet Users
│   ├── utils.crypto.gs        # Utility: SHA-256, validasi password
│   └── setup.database.gs      # Migrasi & seeder schema database
│
├── Frontend (.html) ──────────────────────────────
│   ├── index.html             # Kerangka utama, memanggil include()
│   ├── styles.html            # Semua CSS (dimuat via scriptlet)
│   ├── scripts.html           # Semua JS client-side
│   └── view.login.html        # Semua view: login, register, dashboard
│
└── Config ────────────────────────────────────────
    └── appsscript.json        # Konfigurasi runtime, timezone, akses
```

### Alur Data (Request Lifecycle)

```
Browser (User)
    │
    ▼
index.html          ← doGet() merender template ini
    │
    ├── styles.html   (dimuat via <?!= include('styles'); ?>)
    ├── view.login.html (dimuat via <?!= include('view.login'); ?>)
    └── scripts.html  (dimuat via <?!= include('scripts'); ?>)
         │
         │  google.script.run.apiLoginUser(email, pass)
         ▼
auth.controller.gs   ← Menerima panggilan dari frontend
         │
         ▼
auth.service.gs      ← Validasi logika bisnis
         │
         ▼
user.repository.gs   ← Baca/tulis Google Spreadsheet
         │
         ▼
Google Spreadsheet   ← Database (sheet "Users")
```

---

## 3. Tutorial Setup dari Nol

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
# Clone repo
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
3. Beri izin akses saat diminta (klik **Review Permissions > Allow**)
4. Cek tab **Execution Log** — harus muncul: `[MIGRATE] Tabel 'Users' berhasil dibuat.`

Setelah migrate, jalankan seeder untuk data awal:

1. Pilih fungsi `runSeeder` dari dropdown
2. Klik **▶ Run**
3. Log harus muncul: `[SEED] Berhasil menambahkan data dummy ke tabel 'Users'.`

> **Kredensial default seeder:** `admin@example.com` / `Admin123!`
> Ganti password ini segera setelah deploy pertama.

### Langkah 7 — Deploy sebagai Web App

Di GAS editor:

1. Klik **Deploy > New deployment**
2. Pilih type: **Web app**
3. Isi deskripsi (misal: `v1.0.0`)
4. **Execute as:** `Me` (akun yang memiliki spreadsheet)
5. **Who has access:** sesuai kebutuhan (`Anyone` untuk akses publik)
6. Klik **Deploy**
7. Salin **Web App URL** yang diberikan

Buka URL tersebut di browser — halaman login akan tampil.

### Langkah 8 — Update Kode (Iterasi Berikutnya)

```bash
# Edit kode lokal, lalu push
clasp push

# Untuk melihat perubahan live, buat deployment baru atau gunakan @HEAD URL
# URL @HEAD: https://script.google.com/macros/s/SCRIPT_ID/dev
```

---

## 4. Alur Kerja Database

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
  Users: ["ID", "Email", "PasswordHash", "Role", "Created_At"],

  // Tambahkan tabel baru di sini:
  Products: ["ID", "Name", "Price", "Stock", "Created_At"],
};
```

Setelah disimpan dan di-push, jalankan `runMigrate()` lagi. Fungsi migrate bersifat **idempotent** — sheet yang sudah ada tidak akan dihapus, hanya kolom yang kurang yang ditambahkan.

### Fungsi Database yang Tersedia

```javascript
runMigrate()          // Buat sheet baru sesuai schema (aman, tidak hapus data)
runSeeder()           // Isi data awal (hanya jalan jika sheet masih kosong)
runRefreshAndSeed()   // Reset total + migrate + seed (HAPUS SEMUA DATA!)
runRollbackSpecificTable() // Hapus satu tabel (default: "Users")
```

> ⚠️ **Hati-hati:** `runRefreshAndSeed()` menghapus seluruh data. Jangan jalankan di production.

---

## 5. Alur Autentikasi

### Registrasi

```
Frontend (handleRegister)
    │  google.script.run.apiRegisterAdmin(email, pass)
    ▼
auth.controller.gs → apiRegisterAdmin()
    ▼
auth.service.gs → register()
    ├── Validasi kekuatan password (regex)
    ├── Cek duplikasi email (findByEmail)
    ├── Hash password (CryptoUtils.hashSHA256)
    └── Simpan user baru (userRepo.create)
    ▼
user.repository.gs → create()
    └── sheet.appendRow([id, email, hash, role, createdAt])
```

### Login

```
Frontend (handleLogin)
    │  google.script.run.apiLoginUser(email, pass)
    ▼
auth.controller.gs → apiLoginUser()
    ▼
auth.service.gs → login()
    ├── Cari user by email (findByEmail)
    ├── Hash input password
    └── Bandingkan hash (string comparison)
    ▼
Respons: { success: true, email, role } atau { success: false, message }
```

### Aturan Validasi Password

Password harus memenuhi semua syarat berikut (divalidasi di `utils.crypto.gs`):

- Minimal 8 karakter
- Mengandung minimal 1 huruf kecil (`a-z`)
- Mengandung minimal 1 huruf besar (`A-Z`)
- Mengandung minimal 1 angka (`0-9`)
- Mengandung minimal 1 simbol dari set: `@$!%*?&#`

Contoh password valid: `Admin123!`, `Secure@2025`, `P@ssw0rd`

---

## 6. Konvensi Kode

### Penamaan File

| Tipe | Pola | Contoh |
|------|------|--------|
| Controller | `[domain].controller.gs` | `auth.controller.gs` |
| Service | `[domain].service.gs` | `auth.service.gs` |
| Repository | `[domain].repository.gs` | `user.repository.gs` |
| Utility | `utils.[nama].gs` | `utils.crypto.gs` |
| View | `view.[nama].html` | `view.login.html` |
| Setup | `setup.[nama].gs` | `setup.database.gs` |

### Pola Controller (API Bridge)

Semua fungsi yang dipanggil via `google.script.run` dari frontend harus:

1. Berada di file `*.controller.gs`
2. Dibungkus `try/catch`
3. Selalu mengembalikan objek `{ success: boolean, message: string, ...data }`

```javascript
function apiNamaFungsi(param1, param2) {
  try {
    const service = new NamaService();
    return service.namaMethod(param1, param2);
  } catch (error) {
    return { success: false, message: error.message };
  }
}
```

### Pola Repository

Setiap repository menangani satu sheet/tabel dan mengekspos method CRUD standar:

```javascript
class NamaRepository {
  constructor() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("Spreadsheet tidak ditemukan.");
    this.sheet = ss.getSheetByName("NamaTabel");
  }

  findAll()           // Ambil semua baris
  findById(id)        // Cari berdasarkan kolom ID
  findByField(field, value) // Cari berdasarkan nilai kolom tertentu
  create(data)        // Tambah baris baru
  update(id, data)    // Update baris berdasarkan ID
  delete(id)          // Hapus baris berdasarkan ID
}
```

### Pola Frontend (google.script.run)

Selalu sertakan `withFailureHandler` untuk menangkap error jaringan atau runtime:

```javascript
google.script.run
  .withSuccessHandler(function(response) {
    if (response.success) {
      // handle sukses
    } else {
      // handle error logika bisnis
      showMessage(response.message, "red");
    }
  })
  .withFailureHandler(function(err) {
    // handle error teknis (timeout, crash, dll)
    showMessage("Terjadi kesalahan: " + err.message, "red");
  })
  .namaFungsiController(param1, param2);
```

---

## 7. Menambah Fitur Baru

### Contoh: Menambah Fitur CRUD Produk

#### Langkah 1 — Tambah Schema di `setup.database.gs`

```javascript
this.schema = {
  Users: ["ID", "Email", "PasswordHash", "Role", "Created_At"],
  Products: ["ID", "Name", "Price", "Stock", "Created_At"], // ← tambahkan ini
};
```

Jalankan `runMigrate()` di GAS editor.

#### Langkah 2 — Buat `product.repository.gs`

```javascript
class ProductRepository {
  constructor() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (!ss) throw new Error("Spreadsheet tidak ditemukan.");
    this.sheet = ss.getSheetByName("Products");
    if (!this.sheet) throw new Error("Tabel 'Products' belum dibuat. Jalankan runMigrate().");
  }

  findAll() {
    const data = this.sheet.getDataRange().getValues();
    return data.slice(1).map(row => ({
      id: row[0], name: row[1], price: row[2],
      stock: row[3], createdAt: row[4]
    }));
  }

  create(product) {
    this.sheet.appendRow([
      Utilities.getUuid(),
      product.name,
      product.price,
      product.stock,
      new Date()
    ]);
  }
}
```

#### Langkah 3 — Buat `product.service.gs`

```javascript
class ProductService {
  constructor() {
    this.repo = new ProductRepository();
  }

  getAllProducts() {
    return { success: true, data: this.repo.findAll() };
  }

  createProduct(name, price, stock) {
    if (!name || !price) {
      return { success: false, message: "Nama dan harga wajib diisi." };
    }
    this.repo.create({ name, price: parseFloat(price), stock: parseInt(stock) });
    return { success: true, message: "Produk berhasil ditambahkan." };
  }
}
```

#### Langkah 4 — Tambah di `product.controller.gs` (buat file baru)

```javascript
function apiGetAllProducts() {
  try {
    return new ProductService().getAllProducts();
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function apiCreateProduct(name, price, stock) {
  try {
    return new ProductService().createProduct(name, price, stock);
  } catch (e) {
    return { success: false, message: e.message };
  }
}
```

#### Langkah 5 — Buat View di `view.dashboard.html` (atau tambahkan ke file yang ada)

```html
<div id="products-section">
  <h3>Daftar Produk</h3>
  <button onclick="loadProducts()">Refresh</button>
  <div id="products-list"></div>
</div>
```

#### Langkah 6 — Tambah handler di `scripts.html`

```javascript
function loadProducts() {
  google.script.run
    .withSuccessHandler(function(response) {
      if (response.success) {
        const list = document.getElementById("products-list");
        list.innerHTML = response.data
          .map(p => `<p>${p.name} - Rp${p.price}</p>`)
          .join("");
      }
    })
    .withFailureHandler(function(err) {
      console.error(err.message);
    })
    .apiGetAllProducts();
}
```

---

## 8. Troubleshooting

### Error: "An unknown error has occurred"

**Penyebab paling umum:** Script dijalankan dari Standalone Script, bukan dari Sheet yang terikat.

**Solusi:**
1. Buka Google Sheet yang menjadi database
2. Klik **Extensions > Apps Script**
3. Jalankan fungsi dari sana, bukan dari `script.google.com/home`

### Error: "Tabel 'Users' belum dibuat"

Jalankan `runMigrate()` terlebih dahulu sebelum `runSeeder()` atau menggunakan aplikasi.

### Error: "You do not have permission"

Saat pertama kali menjalankan fungsi GAS yang mengakses Spreadsheet, Google meminta izin. Klik **Review Permissions > pilih akun > Allow**.

### Perubahan Kode Tidak Terlihat di Web App

Deployment GAS bersifat snapshot. Setelah `clasp push`:
- Untuk **testing**: gunakan URL `…/dev` (selalu pakai kode terbaru, hanya bisa diakses oleh pemilik)
- Untuk **production**: buat **New Deployment** baru di menu **Deploy**

### Error: "Cannot read properties of null"

Terjadi jika `getSheetByName()` mengembalikan `null` — artinya sheet belum dibuat. Jalankan `runMigrate()`.

### Seeder Tidak Jalan (Log: SKIP)

Seeder hanya berjalan jika sheet **kosong** (hanya ada header). Jika sheet sudah ada data, seeder dilewati untuk mencegah duplikasi. Untuk reset total, jalankan `runRefreshAndSeed()` — tapi ini **menghapus semua data**.

---

## 9. Batasan & Catatan GAS

### Scope Global

Semua file `.gs` berbagi satu scope global. Urutan pemuatan file tidak dijamin, jadi **hindari memanggil fungsi di level atas file** (di luar class atau function). Deklarasi `class` dan `function` aman karena di-hoist.

### Tidak Ada Session / Cookie Asli

GAS `HtmlService` tidak mendukung session server-side. Untuk state login, gunakan `PropertiesService` (per-user properties) atau `CacheService` sebagai alternatif sederhana.

Contoh menyimpan state login sederhana:

```javascript
// Simpan session setelah login berhasil
function setUserSession(email, role) {
  PropertiesService.getUserProperties().setProperties({
    loggedInEmail: email,
    loggedInRole: role,
    loginTime: new Date().toISOString()
  });
}

// Cek session
function getSession() {
  const props = PropertiesService.getUserProperties().getProperties();
  return props.loggedInEmail ? { email: props.loggedInEmail, role: props.loggedInRole } : null;
}
```

### Batas Eksekusi

| Batasan | Nilai |
|---------|-------|
| Waktu eksekusi per fungsi | 6 menit |
| Quota baca/tulis Spreadsheet | 20.000 baris/detik |
| Ukuran maksimal response HtmlService | ~50 MB |
| Jumlah panggilan `google.script.run` bersamaan | Tidak ada batas resmi, tapi hindari race condition |

### Pengembangan Lokal dengan `clasp`

```bash
clasp pull   # Tarik kode terbaru dari GAS ke lokal
clasp push   # Dorong kode lokal ke GAS
clasp open   # Buka GAS editor di browser
clasp logs   # Lihat Stackdriver logs
```

---

*Dokumen ini dihasilkan berdasarkan analisis kode proyek boilerplate-admin-gas dan diperbaharui setelah perbaikan bug pada sesi development.*