function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('Admin Dashboard App')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fungsi Helper untuk membuat Hash SHA-256 dari password
function hashPassword(input) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, input, Utilities.Charset.UTF_8);
  let output = "";
  for (let i = 0; i < rawHash.length; i++) {
    let v = rawHash[i];
    if (v < 0) v += 256;
    if (v.toString(16).length == 1) output += "0";
    output += v.toString(16);
  }
  return output;
}

// Fungsi Helper untuk validasi password di sisi server
function isPasswordStrong(password) {
  // Regex: min 8 karakter, 1 huruf besar, 1 huruf kecil, 1 angka, 1 karakter spesial
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
  return regex.test(password);
}

function registerAdmin(email, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  
  if (!sheet) {
    return { success: false, message: "Database belum disetup." };
  }

  // 1. Validasi password di sisi server
  if (!isPasswordStrong(password)) {
    return { 
      success: false, 
      message: "Password tidak memenuhi syarat keamanan (Min. 8 karakter, wajib kombinasi huruf besar, huruf kecil, angka, dan karakter spesial)." 
    };
  }

  const data = sheet.getDataRange().getValues();
  const inputEmail = email.trim().toLowerCase();
  
  // 2. Cek apakah email sudah terdaftar
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toString().trim().toLowerCase() === inputEmail) {
      return { success: false, message: "Email sudah terdaftar!" };
    }
  }

  // 3. Hashing password sebelum disimpan ke database
  const hashedPassword = hashPassword(password);
  const newId = Utilities.getUuid();
  const timestamp = new Date();
  
  sheet.appendRow([newId, inputEmail, hashedPassword, 'admin', timestamp]);
  
  return { success: true, message: "Registrasi Admin berhasil dengan password terenkripsi. Silakan login." };
}

function loginUser(email, password) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName('Users');
  
  if (!sheet) {
    return { success: false, message: "Database belum disetup." };
  }

  const data = sheet.getDataRange().getValues();
  const inputEmail = email.trim().toLowerCase();
  
  // Hashing input password login agar bisa dicocokkan dengan hash di database
  const hashedInputPassword = hashPassword(password);
  
  // Verifikasi kredensial
  for (let i = 1; i < data.length; i++) {
    const dbEmail = data[i][1].toString().trim().toLowerCase();
    const dbPassword = data[i][2].toString(); // Ini berupa hash SHA-256 yang tersimpan
    const dbRole = data[i][3];
    
    // Bandingkan email dan hash password-nya
    if (dbEmail === inputEmail && dbPassword === hashedInputPassword) {
      return { success: true, message: "Login berhasil!", role: dbRole, email: dbEmail };
    }
  }
  
  return { success: false, message: "Email atau password salah." };
}