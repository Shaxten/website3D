<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import geometry from '../data/parts.json'

const base = import.meta.env.BASE_URL

// Décalages de chaque pièce quand le boîtier s'éclate, en % de la taille de la scène.
// dx/dy : déplacement dans le plan, z : profondeur (vers le spectateur).
// col : colonne de l'étiquette, slot : position verticale de l'étiquette (en % de la hauteur).
const parts = [
  {
    id: 'screen',
    name: 'Écran large',
    tag: '9,16 pouces',
    specs: [
      ['Résolution', '1920 × 480'],
      ['Connexion', 'USB 2.0, 9 broches'],
      ['Fixation', 'Magnétique, déplaçable'],
    ],
    fly: { dx: -4, dy: -13, z: 26 },
    col: 'left',
    slot: 15,
  },
  {
    id: 'rear-fans',
    name: 'Ventilateurs arrière',
    tag: '2 × 120 mm',
    specs: [
      ['Rôle', 'Évacuation de l\'air chaud'],
      ['Éclairage', 'ARGB 5 V, 3 broches'],
    ],
    fly: { dx: -9, dy: 1, z: 14 },
    col: 'left',
    slot: 47,
  },
  {
    id: 'gpu',
    name: 'Carte graphique',
    tag: '420 mm max.',
    specs: [
      ['Longueur maximale', '420 mm'],
      ['Emplacements PCIe', '7'],
    ],
    fly: { dx: -3, dy: 13, z: 22 },
    col: 'left',
    slot: 80,
  },
  {
    id: 'pump',
    name: 'Refroidissement liquide',
    tag: 'AIO jusqu\'à 360 mm',
    specs: [
      ['Radiateur', '120, 240 ou 360 mm'],
      ['Emplacements', 'Côté et fond'],
      ['Ventirad CPU max.', '168,4 mm'],
    ],
    fly: { dx: 20, dy: -6, z: 38 },
    col: 'right',
    slot: 24,
  },
  {
    id: 'side-fans',
    name: 'Ventilateurs latéraux',
    tag: '3 × 120 mm',
    specs: [
      ['Rôle', 'Entrée d\'air frais'],
      ['Radiateur', 'Jusqu\'à 360 mm'],
      ['Éclairage', 'ARGB 5 V, 3 broches'],
    ],
    fly: { dx: 15, dy: 2, z: 16 },
    col: 'right',
    slot: 66,
  },
].map((p) => ({ ...p, geo: geometry.find((g) => g.id === p.id) }))

const section = ref(null)
const stage = ref(null)
const baseImg = ref(null)
const arena = ref(null)
const partEls = []
const labelEls = []
const lineEls = []
const dotEls = []

const hover = ref(null)
const activeIndex = ref(0)
const exploded = ref(0)
const hintVisible = computed(() => exploded.value < 0.12)

const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const smooth = (t) => t * t * (3 - 2 * t)

let target = 0
let current = 0
let raf = 0

function readScroll() {
  const el = section.value
  const rect = el.getBoundingClientRect()
  const total = rect.height - window.innerHeight
  return total > 0 ? clamp(-rect.top / total) : 0
}

function render(p) {
  const e = smooth(clamp((p - 0.08) / 0.6))
  const lab = smooth(clamp((p - 0.64) / 0.2))
  exploded.value = e
  const size = stage.value.clientWidth
  stage.value.style.transform = `rotateX(${(6 * e).toFixed(2)}deg) rotateY(${(-16 * e).toFixed(2)}deg)`
  baseImg.value.style.opacity = (1 - 0.84 * e).toFixed(3)
  baseImg.value.style.filter = `grayscale(${e.toFixed(3)})`

  parts.forEach((pt, i) => {
    const el = partEls[i]
    const f = pt.fly
    el.style.transform = `translate3d(${((f.dx * e * size) / 100).toFixed(1)}px, ${((f.dy * e * size) / 100).toFixed(1)}px, ${((f.z * e * size) / 100).toFixed(1)}px)`
    el.style.filter = `drop-shadow(0 ${(22 * e).toFixed(1)}px ${(30 * e).toFixed(1)}px rgba(13, 16, 23, ${(0.3 * e).toFixed(3)}))`
    labelEls[i].style.opacity = lab.toFixed(3)
  })

  // Pièce active (utile sur mobile, où une seule étiquette est affichée).
  activeIndex.value = Math.min(parts.length - 1, Math.floor(clamp((p - 0.66) / 0.34) * parts.length))

  // Traits de liaison entre les étiquettes et les pièces (ordinateur uniquement).
  const a = arena.value.getBoundingClientRect()
  parts.forEach((pt, i) => {
    const r = partEls[i].getBoundingClientRect()
    const l = labelEls[i].getBoundingClientRect()
    const left = pt.col === 'left'
    const x1 = (left ? l.right : l.left) - a.left
    const y1 = l.top + l.height / 2 - a.top
    const x2 = (left ? r.left + r.width * 0.12 : r.right - r.width * 0.12) - a.left
    const y2 = r.top + r.height / 2 - a.top
    const line = lineEls[i]
    line.setAttribute('x1', x1.toFixed(1))
    line.setAttribute('y1', y1.toFixed(1))
    line.setAttribute('x2', x2.toFixed(1))
    line.setAttribute('y2', y2.toFixed(1))
    line.style.opacity = lab.toFixed(3)
    dotEls[i].setAttribute('cx', x2.toFixed(1))
    dotEls[i].setAttribute('cy', y2.toFixed(1))
    dotEls[i].style.opacity = lab.toFixed(3)
  })
}

function tick() {
  raf = 0
  const diff = target - current
  current = reduceMotion || Math.abs(diff) < 0.0004 ? target : current + diff * 0.14
  render(current)
  if (current !== target) raf = requestAnimationFrame(tick)
}
function onScroll() {
  target = readScroll()
  if (!raf) raf = requestAnimationFrame(tick)
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (raf) cancelAnimationFrame(raf)
})

const pct = (v) => `${(v / 1500) * 100}%`
</script>

<template>
  <section id="composants" ref="section" class="xv">
    <div class="xv__sticky">
      <header class="wrap xv__head">
        <p class="eyebrow">Vue éclatée</p>
        <h2 class="xv__title">Les composants se détachent</h2>
      </header>

      <div class="wrap xv__arena" ref="arena">
        <div class="xv__scene">
          <div class="xv__stage" ref="stage">
            <img
              ref="baseImg"
              class="xv__base"
              :src="`${base}media/front.webp`"
              width="1500"
              height="1500"
              alt="Boîtier A70 Vision White vu de face"
            />
            <img
              v-for="(pt, i) in parts"
              :key="pt.id"
              :ref="(el) => (partEls[i] = el)"
              class="xv__part"
              :class="{ dim: hover && hover !== pt.id }"
              :src="`${base}media/parts/${pt.id}.webp`"
              :width="pt.geo.w"
              :height="pt.geo.h"
              :alt="pt.name"
              :style="{
                left: pct(pt.geo.x),
                top: pct(pt.geo.y),
                width: pct(pt.geo.w),
                height: pct(pt.geo.h),
              }"
              @pointerenter="hover = pt.id"
              @pointerleave="hover = null"
            />
          </div>
        </div>

        <svg class="xv__lines" aria-hidden="true">
          <template v-for="(pt, i) in parts" :key="pt.id">
            <line :ref="(el) => (lineEls[i] = el)" />
            <circle :ref="(el) => (dotEls[i] = el)" r="5" />
          </template>
        </svg>

        <article
          v-for="(pt, i) in parts"
          :key="pt.id"
          :ref="(el) => (labelEls[i] = el)"
          class="xv__label"
          :class="[`xv__label--${pt.col}`, { 'is-active': i === activeIndex, 'is-hover': hover === pt.id }]"
          :style="{ top: pt.slot + '%' }"
          tabindex="0"
          @pointerenter="hover = pt.id"
          @pointerleave="hover = null"
          @focus="hover = pt.id"
          @blur="hover = null"
        >
          <span class="xv__n">{{ String(i + 1).padStart(2, '0') }}</span>
          <h3>{{ pt.name }}</h3>
          <p class="xv__tag">{{ pt.tag }}</p>
          <dl>
            <div v-for="[k, v] in pt.specs" :key="k">
              <dt>{{ k }}</dt>
              <dd>{{ v }}</dd>
            </div>
          </dl>
        </article>
      </div>

      <p class="xv__hint" :class="{ gone: !hintVisible }">
        <span aria-hidden="true"></span>
        Faites défiler pour éclater le boîtier
      </p>
    </div>
  </section>
</template>

<style scoped>
.xv {
  position: relative;
  height: 420vh;
  /* Fond blanc comme l'image de base, pour qu'aucun bord ne soit visible. */
  background: #fff;
}
.xv__sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.9rem;
  padding-top: var(--nav-h);
  padding-bottom: 1rem;
}
.xv__title {
  font-size: clamp(1.5rem, 3vw, 2.4rem);
  font-weight: 600;
  margin-top: 0.4rem;
}

.xv__arena {
  position: relative;
  height: min(660px, calc(100svh - var(--nav-h) - 9rem));
  display: grid;
  place-items: center;
}
.xv__scene {
  height: 100%;
  aspect-ratio: 1;
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
  transition: opacity 0.25s ease;
  will-change: transform;
}
.xv__part.dim {
  opacity: 0.3;
}

.xv__lines {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}
.xv__lines line {
  stroke: var(--ink);
  stroke-width: 1.5;
  opacity: 0;
}
.xv__lines circle {
  fill: var(--accent);
  stroke: #fff;
  stroke-width: 2.5;
  opacity: 0;
}

.xv__label {
  position: absolute;
  width: min(250px, 23%);
  min-width: 210px;
  transform: translateY(-50%);
  padding: 1rem 1.15rem 1.1rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  box-shadow: 0 18px 40px -22px rgba(13, 16, 23, 0.45), 0 0 0 1px var(--line);
  opacity: 0;
  transition: box-shadow 0.2s, background 0.2s;
  outline-offset: 4px;
}
.xv__label--left {
  left: 0;
}
.xv__label--right {
  right: 0;
}
.xv__label.is-hover {
  box-shadow: 0 22px 44px -20px rgba(29, 127, 224, 0.55), 0 0 0 2px var(--accent);
}
.xv__n {
  font-family: var(--font-display);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--accent-ink);
}
.xv__label h3 {
  font-size: 1.15rem;
  font-weight: 600;
  margin-top: 0.15rem;
}
.xv__tag {
  display: inline-block;
  margin: 0.4rem 0 0.6rem;
  padding: 0.15rem 0.6rem;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
}
.xv__label dl {
  margin: 0;
  display: grid;
  gap: 0.3rem;
}
.xv__label dl div {
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  font-size: 0.82rem;
  line-height: 1.35;
  padding-top: 0.3rem;
  border-top: 1px solid var(--line);
}
.xv__label dt {
  color: var(--muted);
}
.xv__label dd {
  margin: 0;
  font-weight: 500;
  text-align: right;
}

.xv__hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  margin: 0;
  font-size: 0.85rem;
  color: var(--muted);
  transition: opacity 0.4s;
}
.xv__hint.gone {
  opacity: 0;
}
.xv__hint span {
  width: 18px;
  height: 28px;
  border: 2px solid #c1c7d2;
  border-radius: 10px;
  position: relative;
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

/* Tablette et mobile : une seule étiquette sous la scène, celle de la pièce active. */
@media (max-width: 1000px) {
  .xv__arena {
    height: auto;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.8rem;
  }
  .xv__scene {
    height: auto;
    width: min(100%, 420px, calc(100svh - var(--nav-h) - 17rem));
  }
  .xv__lines {
    display: none;
  }
  .xv__label {
    position: relative;
    inset: auto !important;
    top: auto !important;
    transform: none;
    width: 100%;
    max-width: 520px;
    display: none;
  }
  .xv__label.is-active {
    display: block;
  }
  .xv__hint {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .xv__hint span::after {
    animation: none;
  }
}
</style>

