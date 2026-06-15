class UserRepository {
  constructor() {
    this.sheetName = "Users";
    this.sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(
      this.sheetName,
    );
  }

  findAll() {
    if (!this.sheet) throw new Error("Database belum disetup.");
    return this.sheet.getDataRange().getValues();
  }

  findByEmail(email) {
    const data = this.findAll();
    for (let i = 1; i < data.length; i++) {
      if (
        data[i][1].toString().trim().toLowerCase() ===
        email.trim().toLowerCase()
      ) {
        return {
          id: data[i][0],
          email: data[i][1],
          passwordHash: data[i][2],
          role: data[i][3],
        };
      }
    }
    return null;
  }

  create(user) {
    if (!this.sheet) throw new Error("Database belum disetup.");
    this.sheet.appendRow([
      user.id,
      user.email,
      user.passwordHash,
      user.role,
      user.createdAt,
    ]);
  }
}
