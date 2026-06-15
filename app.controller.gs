// app.controller.gs

function doGet() {
  // Gunakan createTemplateFromFile agar kita bisa mengeksekusi tag penyisipan <?!= ?>
  return HtmlService.createTemplateFromFile("index")
    .evaluate()
    .setTitle("Admin Dashboard App")
    .addMetaTag("viewport", "width=device-width, initial-scale=1")
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

// Fungsi helper mutlak untuk menyisipkan file HTML/CSS/JS ke file index utama
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}
