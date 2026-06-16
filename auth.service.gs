/**
 * auth.service.gs
 * Business logic untuk autentikasi: register & login.
 * Login menyimpan session via AuthMiddleware.createSession().
 */

class AuthService {
  constructor() {
    this.userRepo = new UserRepository();
  }

  register(email, password) {
    if (!CryptoUtils.isPasswordStrong(password)) {
      return {
        success: false,
        message:
          "Password tidak memenuhi syarat: min 8 karakter, " +
          "huruf besar, huruf kecil, angka, dan simbol (@$!%*?&#).",
      };
    }

    const existingUser = this.userRepo.findByEmail(email);
    if (existingUser) {
      return { success: false, message: "Email sudah terdaftar." };
    }

    const newUser = {
      id: Utilities.getUuid(),
      email: email.trim().toLowerCase(),
      passwordHash: CryptoUtils.hashSHA256(password),
      role: "admin",
      createdAt: new Date(),
    };

    this.userRepo.create(newUser);
    return { success: true, message: "Registrasi berhasil. Silakan login." };
  }

  login(email, password) {
    const user = this.userRepo.findByEmail(email);
    if (!user) {
      return { success: false, message: "Email atau password salah." };
    }

    const hashedInput = CryptoUtils.hashSHA256(password);
    if (user.passwordHash !== hashedInput) {
      return { success: false, message: "Email atau password salah." };
    }

    // Buat session setelah kredensial valid
    AuthMiddleware.createSession(user.email, user.role);

    return {
      success: true,
      message: "Login berhasil.",
      role: user.role,
      email: user.email,
    };
  }

  logout() {
    AuthMiddleware.destroySession();
    return { success: true, message: "Logout berhasil." };
  }
}
