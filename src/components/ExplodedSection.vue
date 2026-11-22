<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import geometry from '../data/parts.json'
import { loaded, reduceMotion, scrollToY, lenis } from '../state.js'

const base = import.meta.env.BASE_URL

// Ordre de visite des pièces (de haut en bas du boîtier).
// pieces : découpes du boîtier qui forment la pièce (elles bougent ensemble).
// fly : décalage quand le boîtier s'éclate, en % de la scène (dx/dy dans le plan, z vers le spectateur).
const parts = [
  {
    id: 'screen',
    name: 'Écran large',
    tag: '9,16 pouces',
    text: 'Fixé sous le carénage haut, il affiche températures CPU et GPU, fréquences, mémoire et heure, visibles à travers la vitre.',
    specs: [
      ['Résolution', '1920 × 480'],
      ['Connexion', 'USB 2.0, 9 broches'],
      ['Fixation', 'Magnétique, déplaçable'],
    ],
    pieces: [{ id: 'screen', fly: { dx: -4, dy: -14, z: 26 } }],
    photo: { src: 'screen.webp', w: 1400, h: 714 },
  },
  {
    id: 'pump',
    name: 'Refroidissement liquide',
    tag: 'AIO 360 mm',
    text: 'Le radiateur se monte sur le côté avec ses trois ventilateurs de 120 mm. Le bloc pompe intègre son propre écran pour l\'heure et des animations.',
    specs: [
      ['Radiateur', '120, 240 ou 360 mm'],
      ['Ventilateurs', '3 × 120 mm, ARGB'],
      ['Emplacements', 'Côté et fond'],
      ['Ventirad CPU max.', '168,4 mm'],
    ],
    // Bloc pompe + radiateur latéral avec ses trois ventilateurs.
    pieces: [
      { id: 'pump', fly: { dx: 18, dy: -5, z: 36 } },
      { id: 'side-fans', fly: { dx: 16, dy: -2, z: 30 } },
    ],
    photo: { src: 'aio.webp', w: 645, h: 1400 },
  },
  {
    id: 'rear-fans',
    name: 'Ventilateurs arrière',
    tag: '2 × 120 mm',
    text: 'Deux ventilateurs de 120 mm évacuent l\'air chaud vers l\'arrière, avec une bordure lumineuse ARGB.',
    specs: [
      ['Rôle', 'Évacuation de l\'air chaud'],
      ['Éclairage', 'ARGB 5 V, 3 broches'],
    ],
    pieces: [{ id: 'rear-fans', fly: { dx: -10, dy: 1, z: 14 } }],
    photo: { src: 'fans.webp', w: 1400, h: 1206 },
  },
]
const N = parts.length
// Toutes les découpes à afficher, chacune rattachée à sa pièce.
const pieces = parts.flatMap((pt, part) =>
  pt.pieces.map((pc) => ({ ...pc, part, geo: geometry.find((g) => g.id === pc.id) })),
)

// Chronologie du défilement (0 → 1 sur toute la hauteur de la section).
const EXPLODE = [0.05, 0.2] // le boîtier s'éclate
const FOCUS = [0.24, 0.92] // la caméra passe d'une pièce à l'autre
const REASSEMBLE = [0.94, 1] // tout se remet en place

// Chiffres clés de l'introduction, animés de 0 à leur valeur.
const facts = ref([
  { prefix: '', value: 9, suffix: ',16″', label: 'écran intégré', shown: 0 },
  { prefix: '', value: 360, suffix: ' mm', label: 'radiateur latéral', shown: 0 },
  { prefix: '8 × ', value: 120, suffix: ' mm', label: 'emplacements ventilateurs', shown: 0 },
])

const section = ref(null)
const cam = ref(null)
const stage = ref(null)
const baseImg = ref(null)
const pieceEls = []
const shotEls = []
const decor = { grid: ref(null), ghost: ref(null), floor: ref(null) }

const focus = ref(0)
const zoom = ref(0)
const intro = ref(1)
const entered = ref(false)
const active = computed(() => Math.min(N - 1, Math.round(focus.value)))

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (t) => t * t * (3 - 2 * t)
const lerp = (a, b, t) => a + (b - a) * t
const span = (p, [a, b]) => smooth(clamp((p - a) / (b - a)))

let target = 0
let current = 0
let raf = 0
let tease = 0
let camNow = { tx: 0, ty: 0, s: 1 }
let centers = null // positions des pièces éclatées, mesurées une fois (invalidées au redimensionnement)
let last = 0

function readScroll() {
  const rect = section.value.getBoundingClientRect()
  const total = rect.height - window.innerHeight
  return total > 0 ? clamp(-rect.top / total) : 0
}

const ROT_X = 6
const ROT_Y = -10

function placeParts(e, size) {
  stage.value.style.transform = `rotateX(${(ROT_X * e).toFixed(2)}deg) rotateY(${(ROT_Y * e).toFixed(2)}deg)`
  pieces.forEach((pc, i) => {
    const f = pc.fly
    pieceEls[i].style.transform = `translate3d(${((f.dx * e * size) / 100).toFixed(1)}px, ${((f.dy * e * size) / 100).toFixed(1)}px, ${((f.z * e * size) / 100).toFixed(1)}px)`
  })
}

// Mesure, une seule fois, où se trouve chaque pièce quand le boîtier est éclaté
// (dans le repère de la caméra). Évite de relire la mise en page à chaque image.
function measureCenters(size) {
  const c = cam.value
  c.style.transform = 'none'
  placeParts(1, size)
  const box = c.getBoundingClientRect()
  // Boîte englobant toutes les découpes de chaque pièce.
  centers = parts.map((_, p) => {
    const rs = pieces.flatMap((pc, i) => (pc.part === p ? [pieceEls[i].getBoundingClientRect()] : []))
    const l = Math.min(...rs.map((r) => r.left))
    const t = Math.min(...rs.map((r) => r.top))
    const w = Math.max(...rs.map((r) => r.right)) - l
    const h = Math.max(...rs.map((r) => r.bottom)) - t
    return { x: l + w / 2 - box.left, y: t + h / 2 - box.top, w, h }
  })
  const parent = c.offsetParent.getBoundingClientRect()
  centers.origin = { left: parent.left + c.offsetLeft, top: parent.top + c.offsetTop }
}

// Point d'ancrage du gros plan : à gauche de la fiche sur ordinateur, en haut sur mobile.
function anchor(vw, vh, mobile) {
  return mobile ? { x: vw * 0.5, y: vh * 0.34, w: vw * 0.86, h: vh * 0.38 } : { x: vw * 0.4, y: vh * 0.5, w: vw * 0.4, h: vh * 0.72 }
}

function camOn(m, a) {
  const s = clamp(Math.min((a.h * 0.8) / m.h, (a.w * 0.8) / m.w), 1, 2.6)
  return { s, tx: a.x - centers.origin.left - m.x * s, ty: a.y - centers.origin.top - m.y * s }
}

function render(p) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const mobile = vw < 900
  const size = cam.value.clientWidth

  const introAmt = 1 - smooth(clamp(p / 0.07))
  const e = Math.max(span(p, EXPLODE) * (1 - span(p, REASSEMBLE)), tease)
  const z = span(p, [0.19, 0.25]) * (1 - span(p, [0.92, 0.95]))

  let fp = 0
  if (p >= FOCUS[0]) {
    const f = clamp((p - FOCUS[0]) / (FOCUS[1] - FOCUS[0])) * N
    const k = Math.min(N - 1, Math.floor(f))
    fp = k + (k < N - 1 ? smooth(clamp((f - k - 0.6) / 0.4)) : 0)
  }

  if (z > 0 && !centers) measureCenters(size)
  placeParts(e, size)
  baseImg.value.style.opacity = ((1 - 0.8 * e) * (1 - 0.6 * z)).toFixed(3)

  const a = anchor(vw, vh, mobile)
  parts.forEach((pt, i) => {
    const near = clamp(1 - Math.abs(fp - i))
    // Gros plan : la photo produit apparaît quand la caméra est posée sur la pièce.
    const shot = smooth(clamp(1 - Math.abs(fp - i) * 2.6)) * smooth(clamp((z - 0.6) / 0.4))
    const op = ((1 - z * 0.9 * (1 - near)) * (1 - 0.95 * shot)).toFixed(3)
    pieces.forEach((pc, j) => pc.part === i && (pieceEls[j].style.opacity = op))
    const el = shotEls[i]
    el.style.opacity = shot.toFixed(3)
    el.style.visibility = shot > 0.002 ? 'visible' : 'hidden'
    const ar = pt.photo.w / pt.photo.h
    const w = Math.min(a.w, a.h * ar)
    const h = w / ar
    const drift = (fp - i) * (mobile ? -30 : -60)
    el.style.width = `${w.toFixed(0)}px`
    el.style.height = `${h.toFixed(0)}px`
    el.style.transform = `translate3d(${(a.x - w / 2 + drift).toFixed(1)}px, ${(a.y - h / 2).toFixed(1)}px, 0) scale(${(0.9 + 0.1 * shot).toFixed(3)})`
  })

  // Caméra : vue d'ensemble (décalée pendant l'intro) mélangée au cadrage de la pièce suivie.
  const is = mobile ? 0.82 : 0.9
  const s0 = lerp(1, is, introAmt)
  const over = {
    s: s0,
    tx: ((1 - s0) * size) / 2 + (mobile ? 0 : vw * 0.17 * introAmt),
    ty: ((1 - s0) * size) / 2 + (mobile ? vh * 0.2 * introAmt : 0),
  }
  let next = over
  if (z > 0) {
    const k0 = Math.floor(fp)
    const k1 = Math.min(N - 1, k0 + 1)
    const ca = camOn(centers[k0], a)
    const cb = camOn(centers[k1], a)
    const t = fp - k0
    const fc = { s: lerp(ca.s, cb.s, t), tx: lerp(ca.tx, cb.tx, t), ty: lerp(ca.ty, cb.ty, t) }
    next = { s: lerp(over.s, fc.s, z), tx: lerp(over.tx, fc.tx, z), ty: lerp(over.ty, fc.ty, z) }
  }
  camNow = next
  cam.value.style.transform = `translate3d(${next.tx.toFixed(1)}px, ${next.ty.toFixed(1)}px, 0) scale(${next.s.toFixed(4)})`

  decor.grid.value.style.opacity = (0.35 + e * 0.65).toFixed(3)
  decor.ghost.value.style.transform = `translate3d(${(e * 6).toFixed(2)}vw, -52%, 0)`
  decor.ghost.value.style.opacity = (1 - e * 0.6).toFixed(3)
  decor.floor.value.style.opacity = (0.35 + e * 0.65).toFixed(3)

  if (Math.abs(focus.value - fp) > 0.001) focus.value = fp
  if (Math.abs(zoom.value - z) > 0.001) zoom.value = z
  if (Math.abs(intro.value - introAmt) > 0.001) intro.value = introAmt
}

// Lissage indépendant de la fréquence d'affichage (60, 120 ou 144 Hz).
function tick(now) {
  raf = 0
  const dt = last ? Math.min(0.05, (now - last) / 1000) : 1 / 60
  last = now
  const diff = target - current
  current = reduceMotion || Math.abs(diff) < 0.0002 ? target : current + diff * (1 - Math.exp(-dt * (lenis ? 14 : 9)))
  render(current)
  if (current !== target) raf = requestAnimationFrame(tick)
  else last = 0
}
function onScroll() {
  target = readScroll()
  if (!raf) raf = requestAnimationFrame(tick)
}
function onResize() {
  centers = null
  onScroll()
}

// Aller directement à une pièce, ou au début de la visite.
function scrollToP(p) {
  const el = section.value
  const total = el.offsetHeight - window.innerHeight
  scrollToY(el.offsetTop + total * p)
}
function goTo(i) {
  scrollToP(FOCUS[0] + ((i + 0.25) / N) * (FOCUS[1] - FOCUS[0]))
}

// Entrée après le chargement : chiffres qui défilent et « respiration » du boîtier.
function playEntrance() {
  entered.value = true
  if (reduceMotion) {
    facts.value.forEach((f) => (f.shown = f.value))
    return
  }
  const t0 = performance.now()
  const step = (now) => {
    const t = (now - t0) / 1000
    const c = clamp((t - 0.7) / 1.6)
    const ce = 1 - Math.pow(1 - c, 4)
    facts.value.forEach((f) => (f.shown = Math.round(f.value * ce)))
    // Le boîtier s'ouvre légèrement puis se referme, pour montrer qu'il se démonte.
    const tt = clamp((t - 1.1) / 2.2)
    tease = Math.sin(Math.PI * tt) * 0.32 * (1 - span(current, [0, 0.04]))
    render(current)
    if (t < 3.4) requestAnimationFrame(step)
    else tease = 0
  }
  requestAnimationFrame(step)
}

watch(loaded, (v) => v && playEntrance())

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onResize)
  onScroll()
  if (loaded.value) playEntrance()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onResize)
  if (raf) cancelAnimationFrame(raf)
})

const pct = (v) => `${(v / 1500) * 100}%`
</script>

<template>
  <section id="composants" ref="section" class="xv" :class="{ 'is-in': entered }">
    <div class="xv__sticky">
      <div class="xv__bg" aria-hidden="true">
        <div :ref="(el) => (decor.grid.value = el)" class="xv__grid"></div>
        <div :ref="(el) => (decor.ghost.value = el)" class="xv__ghost">A70</div>
        <div :ref="(el) => (decor.floor.value = el)" class="xv__floor"></div>
      </div>

      <div class="xv__enter">
        <div ref="cam" class="xv__cam">
          <div class="xv__scene">
            <div ref="stage" class="xv__stage">
              <img
                ref="baseImg"
                class="xv__base"
                :src="`${base}media/front.webp`"
                width="1500"
                height="1500"
                alt="Boîtier Thermalright A70 Vision White vu de face, ventilateurs blancs et éclairage ARGB"
                fetchpriority="high"
              />
              <img
                v-for="(pc, i) in pieces"
                :key="pc.id"
                :ref="(el) => (pieceEls[i] = el)"
                class="xv__part"
                :src="`${base}media/parts/${pc.id}.webp`"
                :width="pc.geo.w"
                :height="pc.geo.h"
                alt=""
                :style="{ left: pct(pc.geo.x), top: pct(pc.geo.y), width: pct(pc.geo.w), height: pct(pc.geo.h) }"
              />
            </div>
          </div>
        </div>

        <!-- Photos produit en haute qualité, affichées en gros plan -->
        <div class="xv__shots">
          <div v-for="(pt, i) in parts" :key="pt.id" :ref="(el) => (shotEls[i] = el)" class="xv__shot">
            <img
              :src="`${base}media/products/${pt.photo.src}`"
              :width="pt.photo.w"
              :height="pt.photo.h"
              :alt="pt.name"
              decoding="async"
            />
          </div>
        </div>
      </div>

      <!-- Introduction, qui s'efface dès le premier coup de molette -->
      <div
        class="xv__intro"
        :style="{ opacity: intro, transform: `translateY(${((1 - intro) * -40).toFixed(1)}px)` }"
        :inert="intro < 0.5 || undefined"
      >
        <div class="wrap">
          <p class="eyebrow xv__in" style="--i: 0">Thermalright · Boîtier PC</p>
          <h1 class="xv__h1 xv__in" style="--i: 1">A70 <span class="rgb-flow">Vision</span><br />White</h1>
          <p class="lead xv__lead xv__in" style="--i: 2">
            Un boîtier panoramique où tout se voit. Faites défiler : il se démonte pièce par pièce.
          </p>
          <div class="xv__cta xv__in" style="--i: 3">
            <button type="button" class="btn btn--primary" @click="goTo(0)">
              Explorer les composants
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
            </button>
            <a class="btn btn--ghost" href="#specs">Caractéristiques</a>
          </div>
          <ul class="xv__facts xv__in" style="--i: 4">
            <li v-for="f in facts" :key="f.label">
              <b :aria-label="`${f.prefix}${f.value}${f.suffix}`">{{ f.prefix }}{{ f.shown }}{{ f.suffix }}</b>
              <span>{{ f.label }}</span>
            </li>
          </ul>
        </div>
      </div>

      <!-- Liste des pièces pour sauter directement à l'une d'elles -->
      <nav class="xv__rail" :class="{ on: zoom > 0.3 }" aria-label="Composants" :inert="zoom <= 0.3 || undefined">
        <button
          v-for="(pt, i) in parts"
          :key="pt.id"
          type="button"
          :class="{ on: i === active }"
          :aria-current="i === active ? 'step' : undefined"
          @click="goTo(i)"
        >
          <span>{{ String(i + 1).padStart(2, '0') }}</span>
          <b>{{ pt.name }}</b>
        </button>
      </nav>

      <div class="xv__cardwrap" :class="{ on: zoom > 0.55 }" aria-live="polite">
        <Transition name="card" mode="out-in">
          <article :key="active" class="xv__card">
            <span class="xv__n">{{ String(active + 1).padStart(2, '0') }} / {{ String(N).padStart(2, '0') }}</span>
            <h2>{{ parts[active].name }}</h2>
            <p class="xv__tag">{{ parts[active].tag }}</p>
            <p class="xv__text">{{ parts[active].text }}</p>
            <dl>
              <div v-for="[k, v] in parts[active].specs" :key="k">
                <dt>{{ k }}</dt>
                <dd>{{ v }}</dd>
              </div>
            </dl>
          </article>
        </Transition>
      </div>

      <p class="xv__hint" :style="{ opacity: Math.max(0, intro * 2 - 1) }" aria-hidden="true">
        <span></span>
        Faites défiler pour démonter le boîtier
      </p>
    </div>
  </section>
</template>

<style scoped>
.xv {
  position: relative;
  height: 800vh;
  background: #fff;
}
.xv__sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  overflow: hidden;
}

/* Décor : grille de « labo », grand A70 en filigrane, lueur ARGB au sol */
.xv__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.xv__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(13, 16, 23, 0.05) 1px, transparent 1px),
    linear-gradient(90deg, rgba(13, 16, 23, 0.05) 1px, transparent 1px);
  background-size: 56px 56px;
  -webkit-mask-image: radial-gradient(ellipse 70% 65% at 55% 50%, #000 20%, transparent 75%);
  mask-image: radial-gradient(ellipse 70% 65% at 55% 50%, #000 20%, transparent 75%);
  opacity: 0.35;
  will-change: opacity;
}
.xv__ghost {
  position: absolute;
  right: -3vw;
  top: 50%;
  transform: translate3d(0, -52%, 0);
  will-change: transform, opacity;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(14rem, 36vw, 38rem);
  letter-spacing: -0.06em;
  line-height: 0.8;
  color: transparent;
  -webkit-text-stroke: 2px #e9ecf2;
  user-select: none;
}
.xv__floor {
  /* Lueur ARGB au sol : dégradés déjà flous, sans filtre coûteux à animer. */
  position: absolute;
  left: 50%;
  bottom: -30vh;
  width: 110vw;
  height: 60vh;
  transform: translateX(-50%);
  background:
    radial-gradient(closest-side at 22% 50%, rgba(255, 45, 149, 0.22), transparent),
    radial-gradient(closest-side at 42% 55%, rgba(255, 212, 0, 0.18), transparent),
    radial-gradient(closest-side at 60% 50%, rgba(46, 230, 107, 0.16), transparent),
    radial-gradient(closest-side at 78% 50%, rgba(25, 182, 255, 0.24), transparent);
  opacity: 0.35;
  will-change: opacity;
}

/* Scène */
.xv__enter {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  /* Le fond blanc des photos se fond dans le décor (grille et lueur visibles au travers). */
  mix-blend-mode: multiply;
  opacity: 0;
  transform: translateY(8vh) scale(0.86);
  filter: blur(14px);
  transition:
    opacity 1.1s ease,
    transform 1.5s cubic-bezier(0.16, 1, 0.3, 1),
    filter 1.2s ease;
}
.is-in .xv__enter {
  opacity: 1;
  transform: none;
  filter: none;
}
.xv__cam {
  width: min(88svh, 100vw - 2rem);
  aspect-ratio: 1;
  transform-origin: 0 0;
  will-change: transform;
}
.xv__scene {
  width: 100%;
  height: 100%;
  perspective: 1800px;
  perspective-origin: 50% 45%;
}
.xv__stage {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}
.xv__base,
.xv__part {
  position: absolute;
  display: block;
  user-select: none;
  -webkit-user-drag: none;
}
.xv__base {
  inset: 0;
  width: 100%;
  height: 100%;
}
.xv__part {
  will-change: transform, opacity;
  filter: drop-shadow(0 18px 24px rgba(13, 16, 23, 0.22));
}

/* Gros plans : positionnés en coordonnées d'écran, par-dessus la scène */
.xv__shots {
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.xv__shot {
  position: absolute;
  left: 0;
  top: 0;
  opacity: 0;
  visibility: hidden;
  transform-origin: 50% 50%;
  will-change: transform, opacity;
}
.xv__shot img {
  width: 100%;
  height: 100%;
  object-fit: contain;
  animation: hover-float 6s ease-in-out infinite;
}
@keyframes hover-float {
  50% {
    transform: translateY(-10px) rotate(-0.6deg);
  }
}

/* Introduction */
.xv__intro {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  pointer-events: none;
}
.xv__intro .wrap > * {
  pointer-events: auto;
  max-width: 34rem;
}
.xv__in {
  opacity: 0;
  transform: translateY(26px);
  transition:
    opacity 0.9s ease,
    transform 1s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: calc(0.35s + var(--i) * 0.1s);
}
.is-in .xv__in {
  opacity: 1;
  transform: none;
}
.xv__h1 {
  font-size: clamp(3.2rem, 8vw, 7.2rem);
  font-weight: 600;
  margin-top: 1.1rem;
}
.xv__h1 span {
  background: var(--rgb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.xv__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 2rem;
}
.xv__facts {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 1rem 2.2rem;
  padding: 0;
  margin: 2.4rem 0 0;
}
.xv__facts li {
  display: flex;
  flex-direction: column;
}
.xv__facts b {
  font-family: var(--font-display);
  font-size: 1.45rem;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.xv__facts span {
  font-size: 0.85rem;
  color: var(--muted);
}

/* Liste des pièces */
.xv__rail {
  position: absolute;
  left: clamp(1rem, 3vw, 3rem);
  top: 50%;
  display: grid;
  gap: 0.3rem;
  transform: translate(-16px, -50%);
  opacity: 0;
  transition:
    opacity 0.4s,
    transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}
.xv__rail.on {
  opacity: 1;
  transform: translate(0, -50%);
}
.xv__rail button {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.45rem 0.9rem 0.45rem 0.5rem;
  border: 0;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  text-align: left;
  font-size: 0.85rem;
  color: var(--muted);
  cursor: pointer;
  transition:
    background 0.3s,
    color 0.3s;
}
.xv__rail button span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--surface-2);
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  transition: background 0.3s;
}
.xv__rail button b {
  font-weight: 500;
}
.xv__rail button:hover {
  color: var(--ink);
}
.xv__rail button.on {
  background: var(--ink);
  color: #fff;
}
.xv__rail button.on span {
  background: var(--rgb);
  background-size: 200% 100%;
  animation: rgb-flow 4s linear infinite;
  color: #fff;
}

/* Fiche de la pièce suivie */
.xv__cardwrap {
  position: absolute;
  right: clamp(1rem, 5vw, 5rem);
  top: 50%;
  width: min(400px, 32vw);
  transform: translate(30px, -50%);
  opacity: 0;
  pointer-events: none;
  transition:
    opacity 0.45s,
    transform 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}
.xv__cardwrap.on {
  opacity: 1;
  transform: translate(0, -50%);
  pointer-events: auto;
}
.xv__card {
  padding: 1.6rem 1.7rem 1.7rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: saturate(180%) blur(18px);
  -webkit-backdrop-filter: saturate(180%) blur(18px);
  box-shadow:
    0 30px 60px -30px rgba(13, 16, 23, 0.45),
    0 0 0 1px var(--line);
}
.xv__n {
  font-family: var(--font-display);
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.14em;
  color: var(--accent-ink);
}
.xv__card h2 {
  font-size: clamp(1.6rem, 2.6vw, 2.3rem);
  font-weight: 600;
  margin-top: 0.4rem;
}
.xv__tag {
  display: inline-block;
  margin: 0.7rem 0 0;
  padding: 0.2rem 0.7rem;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-size: 0.8rem;
  font-weight: 600;
}
.xv__text {
  margin-top: 0.9rem;
  color: var(--muted);
  font-size: 0.98rem;
  line-height: 1.55;
}
.xv__card dl {
  margin: 1.1rem 0 0;
  display: grid;
  gap: 0.35rem;
}
.xv__card dl div {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding-top: 0.4rem;
  border-top: 1px solid var(--line);
  font-size: 0.88rem;
}
.xv__card dt {
  color: var(--muted);
}
.xv__card dd {
  margin: 0;
  font-weight: 500;
  text-align: right;
}
.card-enter-active,
.card-leave-active {
  transition:
    opacity 0.3s ease,
    transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.card-enter-from {
  opacity: 0;
  transform: translateY(18px);
}
.card-leave-to {
  opacity: 0;
  transform: translateY(-12px);
}

/* Indication de défilement */
.xv__hint {
  position: absolute;
  left: 50%;
  bottom: 1.4rem;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
  white-space: nowrap;
}
.xv__hint span {
  position: relative;
  width: 18px;
  height: 28px;
  border: 2px solid #c1c7d2;
  border-radius: 10px;
}
.xv__hint span::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 5px;
  width: 3px;
  height: 6px;
  margin-left: -1.5px;
  border-radius: 3px;
  background: var(--ink);
  animation: cue 1.8s ease-in-out infinite;
}
@keyframes cue {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(9px);
  }
}

/* Tablette et mobile : texte en haut, boîtier dessous, fiche en bas de l'écran */
@media (max-width: 899px) {
  .xv__cam {
    width: min(100vw - 1.5rem, 62svh);
  }
  .xv__intro {
    align-items: flex-start;
    padding-top: 2.2rem;
  }
  .xv__h1 {
    font-size: clamp(2.6rem, 12vw, 4.2rem);
    margin-top: 0.6rem;
  }
  .xv__lead {
    font-size: 1rem;
    margin-top: 0.8rem;
  }
  .xv__cta {
    margin-top: 1.2rem;
  }
  .xv__cta .btn {
    padding: 0.75rem 1.2rem;
    font-size: 0.9rem;
  }
  .xv__facts {
    display: none;
  }
  .xv__rail {
    left: 50%;
    top: 1rem;
    display: flex;
    transform: translate(-50%, -10px);
  }
  .xv__rail.on {
    transform: translate(-50%, 0);
  }
  .xv__rail button {
    padding: 0.2rem;
  }
  .xv__rail button b {
    display: none;
  }
  .xv__cardwrap {
    left: 0.75rem;
    right: 0.75rem;
    top: auto;
    bottom: 5.2rem;
    width: auto;
    transform: translateY(30px);
  }
  .xv__cardwrap.on {
    transform: none;
  }
  .xv__card {
    padding: 1.1rem 1.2rem 1.2rem;
  }
  .xv__text {
    font-size: 0.88rem;
    margin-top: 0.6rem;
  }
  .xv__card dl {
    display: none;
  }
  .xv__hint {
    bottom: 5.4rem;
  }
}
@media (max-height: 560px) and (max-width: 899px) {
  .xv__lead {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .xv__enter,
  .xv__in {
    transition: none;
    opacity: 1;
    transform: none;
    filter: none;
  }
  .xv__shot img,
  .xv__hint span::after,
  .xv__rail button.on span {
    animation: none;
  }
}
</style>
