// Prépare les photos produit (Content/produits) affichées en gros plan dans la vue éclatée.
// Recadre le blanc autour, agrandit proprement les petites images, blanchit le fond
// (pour qu'il disparaisse en mode « multiply ») et exporte en WebP.
import sharp from 'sharp'
import { mkdir } from 'node:fs/promises'

const out = 'public/media/products'
await mkdir(out, { recursive: true })

const items = [
  ['Content/produits/ecran.png', 'screen.webp'],
  ['Content/produits/watercooling.png', 'aio.webp'],
  ['Content/produits/ventilateurs.png', 'fans.webp'],
]
const SIZE = 1400

for (const [src, name] of items) {
  // Fond transparent → blanc d'abord, puis recadrage (sharp applique trim avant flatten dans un même pipeline).
  const flat = await sharp(src).flatten({ background: '#fff' }).png().toBuffer()
  const trimmed = await sharp(flat).trim({ background: '#fff', threshold: 18 }).toBuffer({ resolveWithObject: true })
  const { width, height } = trimmed.info
  const scale = SIZE / Math.max(width, height)
  const { data, info } = await sharp(trimmed.data)
    .resize(Math.round(width * scale), Math.round(height * scale), { kernel: 'lanczos3' })
    .sharpen({ sigma: scale > 1.5 ? 0.9 : 0.5 })
    .raw()
    .toBuffer({ resolveWithObject: true })
  // Les pixels presque blancs (bruit JPEG du fond) deviennent blanc pur.
  for (let i = 0; i < data.length; i += info.channels) {
    const m = Math.min(data[i], data[i + 1], data[i + 2])
    if (m >= 244) data[i] = data[i + 1] = data[i + 2] = 255
  }
  const res = await sharp(data, { raw: info }).webp({ quality: 90, smartSubsample: true }).toFile(`${out}/${name}`)
  console.log(name, res.width, 'x', res.height, Math.round(res.size / 1024), 'Ko')
}
