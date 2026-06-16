/**
 * middleware.auth.gs
 * Middleware autentikasi berbasis server-side session.
 *
 * Menggunakan PropertiesService.getUserProperties() sebagai penyimpanan
 * session per-user Google yang menjalankan script.
 *
 * Lifecycle session:
 *   Login  → createSession(email, role)  → simpan ke UserProperties
 *   Akses  → requireAuth()               → validasi session & expiry
 *   Logout → destroySession()            → hapus semua key session
 */

var AuthMiddleware = (function () {
  // Key yang digunakan di PropertiesService
  var SESSION_EMAIL = "session_email";
  var SESSION_ROLE = "session_role";
  var SESSION_TIME = "session_created_at";

  // Durasi session: 8 jam (dalam milidetik)
  var SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

  /**
   * Buat session baru setelah login berhasil.
   * @param {string} email
   * @param {string} role
   */
  function createSession(email, role) {
    var props = PropertiesService.getUserProperties();
    props.setProperties({
      [SESSION_EMAIL]: email,
      [SESSION_ROLE]: role,
      [SESSION_TIME]: new Date().getTime().toString(),
    });
  }

  /**
   * Hapus session saat logout.
   */
  function destroySession() {
    var props = PropertiesService.getUserProperties();
    props.deleteProperty(SESSION_EMAIL);
    props.deleteProperty(SESSION_ROLE);
    props.deleteProperty(SESSION_TIME);
  }

  /**
   * Ambil data session aktif.
   * Mengembalikan null jika session tidak ada atau sudah kedaluwarsa.
   * @returns {{ email: string, role: string } | null}
   */
  function getSession() {
    var props = PropertiesService.getUserProperties().getProperties();

    if (!props[SESSION_EMAIL] || !props[SESSION_TIME]) {
      return null;
    }

    var createdAt = parseInt(props[SESSION_TIME], 10);
    var now = new Date().getTime();

    if (now - createdAt > SESSION_DURATION_MS) {
      destroySession();
      return null;
    }

    return {
      email: props[SESSION_EMAIL],
      role: props[SESSION_ROLE],
    };
  }

  /**
   * Guard: pastikan user sudah login.
   * Gunakan ini di controller sebelum menjalankan aksi yang dilindungi.
   *
   * @returns {{ authorized: true, session: object }
   *          | { authorized: false, message: string }}
   */
  function requireAuth() {
    var session = getSession();
    if (!session) {
      return {
        authorized: false,
        message: "Sesi tidak valid atau sudah berakhir. Silakan login kembali.",
      };
    }
    return { authorized: true, session: session };
  }

  /**
   * Guard: pastikan user sudah login DAN memiliki role tertentu.
   * @param {string|string[]} allowedRoles  - role tunggal atau array role
   * @returns {{ authorized: true, session: object }
   *          | { authorized: false, message: string }}
   */
  function requireRole(allowedRoles) {
    var auth = requireAuth();
    if (!auth.authorized) return auth;

    var roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
    if (!roles.includes(auth.session.role)) {
      return {
        authorized: false,
        message: "Akses ditolak. Anda tidak memiliki izin untuk halaman ini.",
      };
    }
    return auth;
  }

  // Public API
  return {
    createSession: createSession,
    destroySession: destroySession,
    getSession: getSession,
    requireAuth: requireAuth,
    requireRole: requireRole,
  };
})();
