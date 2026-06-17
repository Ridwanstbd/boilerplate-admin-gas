/**
 * Inisialisasi awal skema tabel spreadsheet jika diperlukan.
 * Pilih fungsi ini di dropdown editor Apps Script lalu klik Run.
 */
function inisialisasiSkemaSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error(
      "Jalankan skrip ini dari dalam Google Spreadsheet terkait.",
    );
  }

  let sheetLog = ss.getSheetByName("Audit_Aktivitas");
  if (!sheetLog) {
    sheetLog = ss.insertSheet("Audit_Aktivitas");
    sheetLog.appendRow([
      "Waktu Eksekusi",
      "Email Operator",
      "Jenis Tindakan",
      "Detail",
    ]);
    sheetLog
      .getRange(1, 1, 1, 4)
      .setFontWeight("bold")
      .setBackground("#f3f3f3");
    ss.setFrozenRows(1);
    Logger.log("Tabel Audit_Aktivitas berhasil disiapkan.");
  }
}

/**
 * Fungsi global pembantu untuk mencatat log aktivitas pengguna ke sheet.
 */
function catatJejakAudit(tindakan, deskripsi) {
  try {
    const email = Session.getActiveUser().getEmail();
    const sheet =
      SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Audit_Aktivitas");
    if (sheet) {
      sheet.appendRow([new Date(), email, tindakan, deskripsi]);
    }
  } catch (e) {
    Logger.log("Gagal menulis audit log: " + e.message);
  }
}
