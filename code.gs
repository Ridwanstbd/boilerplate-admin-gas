// ====================================================================
// 1. DAFTAR OTORISASI EMAIL & ROLE (Ubah sesuai kebutuhan Anda)
// Opsi Role: "admin" (Akses penuh), "editor" (Tulis data), "viewer" (Lihat saja)
// ====================================================================
const JALUR_AKSES_PENGGUNA = {
  "email.anda@gmail.com": "admin",
  "partner.bisnis@gmail.com": "editor",
  "karyawan.staff@gmail.com": "viewer",
};

// ====================================================================
// 2. CORE ROUTING WEB APP
// ====================================================================
function doGet(e) {
  // Menangkap email akun Google aktif milik pengunjung
  const userEmail = Session.getActiveUser().getEmail();
  const userRole = JALUR_AKSES_PENGGUNA[userEmail];

  // PROTEKSI UTAMA: Jika email tidak terdaftar di whitelist, blokir akses
  if (!userRole) {
    return HtmlService.createHtmlOutput(
      "<div style='font-family: sans-serif; text-align: center; margin-top: 100px; color: #333;'>" +
        "<h1 style='color: #e74c3c;'>⛔ Akses Ditolak</h1>" +
        "<p>Akun Google <b>" +
        (userEmail || "Anonim") +
        "</b> tidak memiliki izin akses ke aplikasi akuntansi ini.</p>" +
        "<p style='color: #666; font-size: 0.9rem;'>Silakan hubungi administrator utama untuk mendaftarkan email Anda.</p>" +
        "</div>",
    ).setTitle("Akses Ditolak");
  }

  // Jika email terdaftar, teruskan memuat halaman utama dan suntik data identitas
  const template = HtmlService.createTemplateFromFile("index");
  template.userEmail = userEmail;
  template.userRole = userRole;

  return template
    .evaluate()
    .setTitle("Sistem Akuntansi Kontrol")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Helper wajib untuk merender sub-konten jika diperlukan
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

// ====================================================================
// 3. MIDDLEWARE LAYER (Validasi Keamanan di Sisi Server)
// ====================================================================
function dapatkanValidasiPengguna() {
  const email = Session.getActiveUser().getEmail();
  const role = JALUR_AKSES_PENGGUNA[email];
  if (!role) throw new Error("Akses Ilegal: Email Anda tidak memiliki izin.");
  return { email: email, role: role };
}

// ====================================================================
// 4. DAFTAR API SERVER (Dipanggil dari Frontend via google.script.run)
// ====================================================================
function apiAmbilDataDashboard() {
  const user = dapatkanValidasiPengguna(); // Validasi ulang keamanan sebelum kirim data
  return {
    success: true,
    totalTerdaftar: Object.keys(JALUR_AKSES_PENGGUNA).length,
    pesan: "Koneksi aman terverifikasi untuk tingkat akses: " + user.role,
  };
}

function apiSimpanPengaturan(dataForm) {
  const user = dapatkanValidasiPengguna();

  // Batasi aksi berdasarkan tingkat Role
  if (user.role !== "admin") {
    return {
      success: false,
      message:
        "Aksi Ditolak: Hanya tingkat 'admin' yang boleh mengubah setelan master!",
    };
  }

  // Tempatkan logika penulisan spreadsheet di sini jika diperlukan
  return {
    success: true,
    message: "Konfigurasi master sistem berhasil diperbarui oleh Admin.",
  };
}
