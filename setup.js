function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheetName = 'Users';
  let sheet = ss.getSheetByName(sheetName);
  
  // Buat sheet baru jika belum ada
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    // Setup header kolom
    const headers = ['ID', 'Email', 'Password', 'Role', 'Created_At'];
    sheet.appendRow(headers);
    
    // Format header
    sheet.getRange("A1:E1").setFontWeight("bold");
    sheet.setFrozenRows(1);
    
    Logger.log("Database 'Users' berhasil dibuat.");
  } else {
    Logger.log("Database 'Users' sudah ada.");
  }
}