
path = "js/app/views/account.js"
src = open(path, encoding="utf-8").read()

OLD = """export async function exportSoulPrintPDF() {
  // Pull You card data from CHARACTERS global (set by sheet.js)
  const you = window.CHARACTERS?.you || {};
  await generateSoulPrint(you);
}"""

NEW = """export async function exportSoulPrintPDF() {
  // Read directly from IDB -- window.CHARACTERS may not be populated yet
  const { dbGet } = await import('../db.js');
  const you = await dbGet('sheets', 'you') || {};
  await generateSoulPrint(you);
}"""

if OLD not in src:
    print("ANCHOR NOT FOUND")
else:
    src = src.replace(OLD, NEW, 1)
    open(path, "w", encoding="utf-8").write(src)
    print("OK account.js")
