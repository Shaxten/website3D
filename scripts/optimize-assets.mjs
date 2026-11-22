// Prépare les médias du site à partir du dossier Content (laissé intact).
// Usage : npm run assets
// Sorties : public/media/*.webp, public/media/showcase.mp4, public/media/tour/*.webp, src/data/tour.json
import { readdir, mkdir, rm, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'
import ffmpegPath from 'ffmpeg-static'

const root = resolve(import.meta.dirname, '..')
const content = join(root, 'Content')
const out = join(root, 'public', 'media')
const tourDir = join(out, 'tour')

// Les noms d'origine contiennent des caractères corrompus : on retrouve les fichiers par motif.
const files = await readdir(content)
const find = (re) => {
  const f = files.find((n) => re.test(n))
  if (!f) throw new Error(`Fichier introuvable dans Content : ${re}`)
  return join(content, f)
}
const src = {
  front: find(/^A70-VISION-WHITE\.jpg$/), // face, fond blanc, sans logo
  iso: find(/^A70-VISION-WHITE-\.jpg$/), // vue isométrique, fond blanc, sans logo
  airflow: find(/^A70-V-W-1500.*-4\.jpg$/), // ventilateurs en bleu clair
  dark: find(/^A70-V-W-1500.*-5\.jpg$/), // fond sombre
  exploded: find(/^A70-V-W-1500.*-6\.jpg$/), // vue éclatée
  screenA: find(/^A70-V-W-1500.*-7\.jpg$/), // gros plan écran
  screenB: find(/^A70-V-W-1500.*-8\.jpg$/), // gros plan écrans (vue de dessus)
  video: find(/\.mp4$/),
}

// Ne supprime que le dossier du tour : public/media/parts est géré par `npm run parts`.
await rm(tourDir, { recursive: true, force: true })
await mkdir(tourDir, { recursive: true })
await mkdir(join(root, 'src', 'data'), { recursive: true })

const webp = (input, name, { width = 1500, quality = 82, extract, whitenBelow } = {}) => {
  let img = sharp(input)
  return (async () => {
    if (whitenBelow) {
      // Efface la bande grise en bas de l'image pour un fond blanc uniforme.
      const w = 1500
      const strip = await sharp({ create: { width: w, height: 1500 - whitenBelow, channels: 3, background: '#fff' } })
        .png()
        .toBuffer()
      const base = await sharp(input).toBuffer()
      img = sharp(base).composite([{ input: strip, top: whitenBelow, left: 0 }])
    }
    if (extract) img = sharp(await img.toBuffer()).extract(extract)
    const info = await img
      .resize({ width, withoutEnlargement: true })
      .webp({ quality })
      .toFile(join(out, name))
    console.log(`${name}  ${info.width}x${info.height}  ${(info.size / 1024).toFixed(0)} Ko`)
  })()
}

await webp(src.front, 'front.webp', { width: 1500, quality: 86, whitenBelow: 1437 })
await webp(src.iso, 'iso.webp', { width: 1400, quality: 85 })
await webp(src.airflow, 'airflow.webp', { width: 1200 })
await webp(src.exploded, 'exploded.webp', { width: 1200 })
await webp(src.dark, 'dark.webp', { width: 1400 })
// Gros plans : on retire le logo et le titre incrustés en haut de l'image.
await webp(src.screenA, 'screen-a.webp', { width: 1200, extract: { left: 0, top: 340, width: 1500, height: 1160 } })
await webp(src.screenB, 'screen-b.webp', { width: 1200, extract: { left: 0, top: 340, width: 1500, height: 1160 } })

// Vidéo : 1280 px de large, sans re-encodage inutile du son.
const run = (args) => {
  const r = spawnSync(ffmpegPath, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' })
  if (r.status !== 0) throw new Error('ffmpeg a échoué')
}
run([
  '-i', src.video,
  '-vf', 'scale=1280:-2',
  '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p',
  '-c:a', 'aac', '-b:a', '96k',
  '-movflags', '+faststart',
  join(out, 'showcase.mp4'),
])
console.log('showcase.mp4 OK')

// Séquence d'images pour le tour piloté par le défilement.
const FPS = 15
const tmp = join(tmpdir(), 'a70-frames')
await rm(tmp, { recursive: true, force: true })
await mkdir(tmp, { recursive: true })
run(['-i', src.video, '-an', '-vf', `fps=${FPS},scale=1280:-2`, '-q:v', '2', join(tmp, 'f%03d.jpg')])
const frames = (await readdir(tmp)).filter((f) => f.endsWith('.jpg')).sort()
let total = 0
for (let i = 0; i < frames.length; i++) {
  const name = `f${String(i + 1).padStart(3, '0')}.webp`
  const info = await sharp(join(tmp, frames[i])).webp({ quality: 70 }).toFile(join(tourDir, name))
  total += info.size
}
const meta = await sharp(join(tmp, frames[0])).metadata()
await writeFile(
  join(root, 'src', 'data', 'tour.json'),
  JSON.stringify({ count: frames.length, fps: FPS, width: meta.width, height: meta.height }, null, 2) + '\n',
)
// Affiche de la vidéo (première image).
await sharp(join(tmp, frames[0])).webp({ quality: 80 }).toFile(join(out, 'poster.webp'))
console.log(`tour : ${frames.length} images, ${(total / 1024 / 1024).toFixed(1)} Mo`)
await rm(tmp, { recursive: true, force: true })
