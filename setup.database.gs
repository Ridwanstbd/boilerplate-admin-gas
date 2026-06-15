/**
 * Modul Database Migration & Seeder
 * Menangani skema tabel dan injeksi data awal
 */

class DatabaseMigration {
  constructor() {
    this.ss = SpreadsheetApp.getActiveSpreadsheet();

    // Skema Tabel KalkuPrice
    this.schema = {
      Users: ["ID", "Email", "PasswordHash", "Role", "Created_At"],
    };
  }

  migrate() {
    for (const [sheetName, columns] of Object.entries(this.schema)) {
      let sheet = this.ss.getSheetByName(sheetName);

      if (!sheet) {
        sheet = this.ss.insertSheet(sheetName);
        sheet.appendRow(columns);
        this._formatHeader(sheet, columns.length);
        Logger.log(`[MIGRATE] Tabel '${sheetName}' berhasil dibuat.`);
      } else {
        const existingHeaders = sheet
          .getRange(1, 1, 1, sheet.getLastColumn() || 1)
          .getValues()[0];
        const missingColumns = columns.filter(
          (col) => !existingHeaders.includes(col),
        );

        if (missingColumns.length > 0) {
          const startCol = existingHeaders.length + 1;
          sheet
            .getRange(1, startCol, 1, missingColumns.length)
            .setValues([missingColumns]);
          this._formatHeader(
            sheet,
            existingHeaders.length + missingColumns.length,
          );
          Logger.log(
            `[UPDATE] Menambahkan kolom ${missingColumns.join(", ")} ke tabel '${sheetName}'.`,
          );
        } else {
          Logger.log(`[OK] Tabel '${sheetName}' sudah up-to-date.`);
        }
      }
    }
    Logger.log("Migrasi / Update selesai.");
  }

  rollback(sheetName) {
    const sheet = this.ss.getSheetByName(sheetName);
    if (sheet) {
      this.ss.deleteSheet(sheet);
      Logger.log(`[ROLLBACK] Tabel '${sheetName}' berhasil dihapus.`);
    } else {
      Logger.log(`[SKIP] Tabel '${sheetName}' tidak ditemukan.`);
    }
  }

  refresh() {
    let tempSheet = this.ss.getSheetByName("Temp_Safe_Sheet");
    if (!tempSheet) tempSheet = this.ss.insertSheet("Temp_Safe_Sheet");

    for (const sheetName of Object.keys(this.schema)) {
      this.rollback(sheetName);
    }

    this.migrate();
    this.ss.deleteSheet(tempSheet);
    Logger.log(`[REFRESH] Semua tabel telah di-reset ulang menjadi kosong.`);
  }

  /**
   * SEEDER: Memasukkan data dummy awal untuk keperluan testing
   */
  seed() {
    // Fungsi hash internal agar seeder tidak perlu memanggil utils eksternal
    const hashPassword = (input) => {
      const rawHash = Utilities.computeDigest(
        Utilities.DigestAlgorithm.SHA_256,
        input,
        Utilities.Charset.UTF_8,
      );
      let output = "";
      for (let i = 0; i < rawHash.length; i++) {
        let v = rawHash[i];
        if (v < 0) v += 256;
        if (v.toString(16).length == 1) output += "0";
        output += v.toString(16);
      }
      return output;
    };

    const timestamp = new Date();

    // ID Relasional untuk data dummy
    const adminId = Utilities.getUuid();
    const productId = Utilities.getUuid();

    // Data Dummy KalkuPrice (Contoh: Keripik Pisang Lumer)
    const seedData = {
      Users: [
        [
          adminId,
          "admin@kalkuprice.com",
          hashPassword("Admin123!"),
          "admin",
          timestamp,
        ],
      ],
    };

    for (const [sheetName, rows] of Object.entries(seedData)) {
      const sheet = this.ss.getSheetByName(sheetName);
      if (sheet) {
        // Cek apakah tabel masih kosong (hanya ada header)
        if (sheet.getLastRow() <= 1) {
          rows.forEach((row) => sheet.appendRow(row));
          Logger.log(
            `[SEED] Berhasil menambahkan data dummy ke tabel '${sheetName}'.`,
          );
        } else {
          Logger.log(
            `[SKIP] Tabel '${sheetName}' sudah berisi data. Seeder dibatalkan untuk mencegah duplikasi.`,
          );
        }
      } else {
        Logger.log(
          `[ERROR] Tabel '${sheetName}' tidak ditemukan. Jalankan runMigrate() terlebih dahulu.`,
        );
      }
    }
  }

  _formatHeader(sheet, numCols) {
    if (numCols > 0) {
      const headerRange = sheet.getRange(1, 1, 1, numCols);
      headerRange.setFontWeight("bold");
      headerRange.setBackground("#f3f3f3");
      sheet.setFrozenRows(1);
    }
  }
}

// =====================================================================
// EXPOSED FUNCTIONS (Pilih fungsi ini di Dropdown Apps Script)
// =====================================================================

function runMigrate() {
  const db = new DatabaseMigration();
  db.migrate();
}

function runSeeder() {
  const db = new DatabaseMigration();
  db.seed();
}

/** * Fungsi Ultimate untuk Development:
 * Hapus Semua Tabel -> Buat Ulang Tabel -> Masukkan Data Dummy
 */
function runRefreshAndSeed() {
  const db = new DatabaseMigration();
  db.refresh();
  db.seed();
  Logger.log(
    "DATABASE SIAP DIGUNAKAN! Login: admin@kalkuprice.com | Pass: Admin123!",
  );
}

function runRollbackSpecificTable() {
  const db = new DatabaseMigration();
  db.rollback("Products");
}
