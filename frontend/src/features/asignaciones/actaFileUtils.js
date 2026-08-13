/** Tipos permitidos para el acta de entrega (PDF o imagen). */
export const ACTA_ACCEPT =
  "application/pdf,image/jpeg,image/png,image/webp,.pdf,.jpg,.jpeg,.png,.webp"

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
])

const ALLOWED_EXT = [".pdf", ".jpg", ".jpeg", ".png", ".webp"]

export function esArchivoActaValido(file) {
  if (!file) return false
  if (ALLOWED_MIME.has(file.type)) return true
  const name = (file.name || "").toLowerCase()
  return ALLOWED_EXT.some((ext) => name.endsWith(ext))
}

export function esPdfActa(fileOrName) {
  if (!fileOrName) return false
  if (typeof fileOrName === "string") {
    return fileOrName.toLowerCase().endsWith(".pdf") || fileOrName === "application/pdf"
  }
  if (fileOrName.type === "application/pdf") return true
  return (fileOrName.name || "").toLowerCase().endsWith(".pdf")
}

export function esImagenActa(fileOrBlob) {
  if (!fileOrBlob) return false
  const type = fileOrBlob.type || ""
  if (type.startsWith("image/")) return true
  const name = (fileOrBlob.name || "").toLowerCase()
  return [".jpg", ".jpeg", ".png", ".webp"].some((ext) => name.endsWith(ext))
}
