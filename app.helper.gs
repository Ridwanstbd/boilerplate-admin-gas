/**
 * app.helper.gs
 * Fungsi-fungsi helper umum yang dapat dipanggil dari client
 * via google.script.run.
 */

/**
 * Kembalikan URL deployment Web App saat ini.
 * Digunakan oleh client untuk redirect setelah login/logout,
 * sehingga doGet() dievaluasi ulang dengan session terbaru.
 * @returns {string}
 */
function getWebAppUrl() {
  return ScriptApp.getService().getUrl();
}
