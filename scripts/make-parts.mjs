// Détoure les composants visibles sur le rendu de face (fond transparent).
// Usage : npm run parts
// Sorties : public/media/parts/*.webp, src/data/parts.json
// Les coordonnées sont exprimées dans le repère de l'image source (1500 × 1500).
import { readdir, mkdir, writeFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import sharp from 'sharp'

const root = resolve(import.meta.dirname, '..')
const content = join(root, 'Content')
const files = await readdir(content)
const file = files.find((n) => /^A70-VISION-WHITE\.jpg$/.test(n))
if (!file) throw new Error('A70-VISION-WHITE.jpg introuvable dans Content')
const source = join(content, file)

const parts = [
  { id: 'screen', polygon: [[437, 492], [880, 366], [894, 372], [894, 574], [505, 628], [440, 624]] },
  { id: 'pump', polygon: [[410, 732], [690, 706], [693, 886], [606, 910], [412, 912]] },
  // Encoche à droite : le bloc du refroidisseur passe devant les ventilateurs arrière.
  {
    id: 'rear-fans',
    polygon: [[229, 448], [406, 448], [440, 482], [440, 722], [404, 722], [404, 918], [440, 918], [440, 966], [406, 1000], [229, 1000], [195, 966], [195, 482]],
  },
  // Encoche en bas à gauche : la carte graphique passe devant les ventilateurs latéraux.
  {
    id: 'side-fans',
    polygon: [[1022, 440], [1172, 440], [1206, 474], [1206, 1292], [1172, 1326], [1022, 1326], [988, 1292], [988, 1172], [1076, 1172], [1076, 944], [988, 944], [988, 474]],
  },
  { id: 'gpu', polygon: [[218, 1048], [485, 1012], [760, 952], [1068, 982], [1074, 1152], [980, 1168], [520, 1210], [218, 1214]] },
]

const PAD = 6
const outDir = join(root, 'public', 'media', 'parts')
await mkdir(outDir, { recursive: true })
await mkdir(join(root, 'src', 'data'), { recursive: true })

const meta = []
for (const p of parts) {
  const pts = p.polygon ?? [
    [p.rect[0], p.rect[1]],
    [p.rect[0] + p.rect[2], p.rect[1] + p.rect[3]],
  ]
  const x = Math.max(0, Math.min(...pts.map((q) => q[0])) - PAD)
  const y = Math.max(0, Math.min(...pts.map((q) => q[1])) - PAD)
  const w = Math.min(1500, Math.max(...pts.map((q) => q[0])) + PAD) - x
  const h = Math.min(1500, Math.max(...pts.map((q) => q[1])) + PAD) - y

  const shape = p.polygon
    ? `<polygon points="${p.polygon.map(([px, py]) => `${px - x},${py - y}`).join(' ')}" fill="#fff"/>`
    : `<rect x="${p.rect[0] - x}" y="${p.rect[1] - y}" width="${p.rect[2]}" height="${p.rect[3]}" rx="${p.rect[4]}" fill="#fff"/>`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">${shape}</svg>`

  // Masque en niveaux de gris, légèrement adouci pour éviter les bords crénelés.
  const mask = await sharp(Buffer.from(svg))
    .flatten({ background: '#000000' })
    .greyscale()
    .blur(0.8)
    .extractChannel(0)
    .raw()
    .toBuffer()

  const rgb = await sharp(source).extract({ left: x, top: y, width: w, height: h }).removeAlpha().raw().toBuffer()
  const info = await sharp(rgb, { raw: { width: w, height: h, channels: 3 } })
    .joinChannel(mask, { raw: { width: w, height: h, channels: 1 } })
    .webp({ quality: 90, alphaQuality: 95 })
    .toFile(join(outDir, `${p.id}.webp`))
  console.log(`${p.id}.webp  ${w}x${h}  ${(info.size / 1024).toFixed(0)} Ko`)
  meta.push({ id: p.id, x, y, w, h })
}

await writeFile(join(root, 'src', 'data', 'parts.json'), JSON.stringify(meta, null, 2) + '\n')
