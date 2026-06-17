/**
 * app.controller.gs
 * Entry point aplikasi web.
 *
 * doGet() menjalankan middleware server-side sebelum merender halaman.
 * Jika session valid → render halaman app (dashboard).
 * Jika session tidak ada/kedaluwarsa → render halaman public (login).
 *
 * Ini adalah lapisan proteksi pertama: user yang belum login
 * tidak akan pernah menerima HTML halaman dalam app.
 */

function doGet(e) {
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("Admin Dashboard")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Helper untuk menyisipkan konten file HTML ke dalam template.
 * Digunakan via scriptlet: <?!= include('nama-file'); ?>
 * @param {string} filename  Nama file tanpa ekstensi
 */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
