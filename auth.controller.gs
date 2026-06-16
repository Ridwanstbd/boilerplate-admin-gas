/**
 * auth.controller.gs
 * API bridge antara frontend (google.script.run) dan AuthService.
 * Semua fungsi di sini adalah public dan dapat dipanggil dari client.
 */

function apiRegisterAdmin(email, password) {
  try {
    return new AuthService().register(email, password);
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function apiLoginUser(email, password) {
  try {
    return new AuthService().login(email, password);
  } catch (e) {
    return { success: false, message: e.message };
  }
}

function apiLogout() {
  try {
    return new AuthService().logout();
  } catch (e) {
    return { success: false, message: e.message };
  }
}

/**
 * Digunakan client saat pertama kali load untuk cek apakah session masih aktif.
 * Mengembalikan data session jika valid, atau pesan error jika tidak.
 */
function apiCheckSession() {
  try {
    const auth = AuthMiddleware.requireAuth();
    if (!auth.authorized) {
      return { success: false, message: auth.message };
    }
    return { success: true, session: auth.session };
  } catch (e) {
    return { success: false, message: e.message };
  }
}
