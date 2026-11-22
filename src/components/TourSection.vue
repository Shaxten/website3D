<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import tour from '../data/tour.json'

const base = import.meta.env.BASE_URL
const duration = tour.count / tour.fps

// Chapitres calés sur la chronologie de la vidéo (en secondes).
const chapters = [
  {
    from: 0,
    title: 'Verre d\'angle, sans montant',
    text: 'Deux faces en verre trempé se rejoignent à angle droit. Rien ne coupe la vue sur la machine.',
  },
  {
    from: 1.8,
    title: 'Éclairage ARGB',
    text: 'Un liseré lumineux suit le contour du châssis et des ventilateurs. Il se pilote en ARGB adressable 5 V.',
  },
  {
    from: 5.6,
    title: 'Côté et arrière',
    text: 'Sept emplacements PCIe et deux ventilateurs de 120 mm à l\'arrière, pour une carte mère ATX, Micro-ATX ou Mini-ITX.',
  },
  {
    from: 8,
    title: 'Écrans intégrés',
    text: 'Un écran large et un écran sur le bloc de refroidissement affichent températures, fréquences, charge et heure.',
  },
  {
    from: 10.9,
    title: 'Place pour les grosses cartes',
    text: 'Les cartes graphiques jusqu\'à 420 mm de long trouvent leur place sous la vitre.',
  },
  {
    from: 13,
    title: 'Ventilation sur trois faces',
    text: 'Trois ventilateurs de 120 mm au fond et trois sur le côté, avec des radiateurs jusqu\'à 360 mm.',
  },
]

const section = ref(null)
const canvas = ref(null)
const progress = ref(0)
const loadedCount = ref(0)
const started = ref(false)

const frames = new Array(tour.count)
const ready = computed(() => loadedCount.value >= tour.count)
const loadPercent = computed(() => Math.round((loadedCount.value / tour.count) * 100))
const time = computed(() => progress.value * duration)
const active = computed(() => {
  let idx = 0
  chapters.forEach((c, i) => {
    if (time.value >= c.from) idx = i
  })
  return idx
})

const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let ctx = null
let target = 0
let raf = 0
let lastDrawn = -1
let io = null

function frameUrl(i) {
  return `${base}media/tour/f${String(i + 1).padStart(3, '0')}.webp`
}

function loadFrame(i) {
  return new Promise((resolve) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => {
      frames[i] = img
      loadedCount.value++
      if (i === 0) draw(0, true)
      resolve()
    }
    img.onerror = () => {
      loadedCount.value++
      resolve()
    }
    img.src = frameUrl(i)
  })
}

async function loadAll() {
  if (started.value) return
  started.value = true
  let next = 0
  const worker = async () => {
    while (next < tour.count) await loadFrame(next++)
  }
  await Promise.all(Array.from({ length: 6 }, worker))
}

function draw(index, force = false) {
  if (!ctx) return
  // Frame la plus proche déjà chargée (on privilégie les précédentes).
  let i = index
  while (i >= 0 && !frames[i]) i--
  if (i < 0) {
    i = index
    while (i < tour.count && !frames[i]) i++
  }
  if (i < 0 || i >= tour.count || !frames[i]) return
  if (i === lastDrawn && !force) return
  lastDrawn = i
  ctx.drawImage(frames[i], 0, 0, tour.width, tour.height)
}

function readScroll() {
  const el = section.value
  if (!el) return 0
  const rect = el.getBoundingClientRect()
  const total = rect.height - window.innerHeight
  return total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 0
}

function tick() {
  raf = 0
  const diff = target - progress.value
  progress.value = reduceMotion || Math.abs(diff) < 0.0004 ? target : progress.value + diff * 0.14
  draw(Math.min(tour.count - 1, Math.round(progress.value * (tour.count - 1))))
  if (progress.value !== target) raf = requestAnimationFrame(tick)
}

function onScroll() {
  target = readScroll()
  if (!raf) raf = requestAnimationFrame(tick)
}

function goTo(i) {
  const el = section.value
  if (!el) return
  const total = el.offsetHeight - window.innerHeight
  const p = Math.min(0.999, (chapters[i].from + 0.05) / duration)
  window.scrollTo({ top: el.offsetTop + total * p, behavior: reduceMotion ? 'auto' : 'smooth' })
}

onMounted(() => {
  const c = canvas.value
  c.width = tour.width
  c.height = tour.height
  ctx = c.getContext('2d')
  io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        loadAll()
        io.disconnect()
      }
    },
    { rootMargin: '150% 0px' },
  )
  io.observe(section.value)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  onScroll()
})

onBeforeUnmount(() => {
  io?.disconnect()
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  if (raf) cancelAnimationFrame(raf)
})
</script>

<template>
  <section id="tour" ref="section" class="tour">
    <div class="tour__sticky">
      <div class="wrap tour__head">
        <div>
          <p class="eyebrow">Visite 360°</p>
          <h2 class="tour__title">Faites défiler pour tourner autour</h2>
        </div>
        <ol class="tour__steps" aria-label="Chapitres de la visite">
          <li v-for="(c, i) in chapters" :key="c.title">
            <button
              type="button"
              :class="{ on: i === active, done: i < active }"
              :aria-label="`Aller au chapitre : ${c.title}`"
              :aria-current="i === active ? 'step' : undefined"
              @click="goTo(i)"
            ></button>
          </li>
        </ol>
      </div>

      <div class="tour__stage">
        <canvas
          ref="canvas"
          role="img"
          aria-label="Le boîtier A70 Vision White vu sous différents angles, selon la position de défilement"
        ></canvas>

        <div v-if="!ready" class="tour__loader" role="status">
          <span>Chargement de la visite</span>
          <b>{{ loadPercent }} %</b>
          <i :style="{ transform: `scaleX(${loadedCount / tour.count})` }"></i>
        </div>

        <Transition name="chap" mode="out-in">
          <article :key="active" class="chapter">
            <span class="chapter__n">{{ String(active + 1).padStart(2, '0') }} / {{ String(chapters.length).padStart(2, '0') }}</span>
            <h3>{{ chapters[active].title }}</h3>
            <p>{{ chapters[active].text }}</p>
          </article>
        </Transition>

        <div class="tour__time" aria-hidden="true">
          <i :style="{ transform: `scaleX(${progress})` }"></i>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.tour {
  position: relative;
  height: 700vh;
  background: #fff;
}
.tour__sticky {
  position: sticky;
  top: 0;
  height: 100vh;
  height: 100svh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1.2rem;
  padding-top: var(--nav-h);
  padding-bottom: 1.2rem;
}
.tour__head {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 1.5rem;
}
.tour__title {
  font-size: clamp(1.5rem, 3vw, 2.4rem);
  font-weight: 600;
  margin-top: 0.4rem;
}
.tour__steps {
  display: flex;
  gap: 0.5rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.tour__steps button {
  width: 34px;
  height: 8px;
  border: 0;
  padding: 0;
  border-radius: 8px;
  background: var(--surface-2);
  cursor: pointer;
  transition: background 0.3s, width 0.3s;
}
.tour__steps button.done {
  background: #a9b3c4;
}
.tour__steps button.on {
  width: 56px;
  background: var(--accent);
}

.tour__stage {
  position: relative;
  align-self: center;
  aspect-ratio: 16 / 9;
  width: min(1240px, 100% - 3rem, calc((100svh - var(--nav-h) - 8.5rem) * 1.7778));
  border-radius: var(--radius);
  overflow: hidden;
  background: #dcdde0;
  box-shadow: 0 40px 80px -40px rgba(13, 16, 23, 0.45), 0 0 0 1px var(--line);
}
.tour__stage canvas {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.tour__loader {
  position: absolute;
  inset: auto 0 0 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8rem 1.2rem;
  font-size: 0.85rem;
  background: rgba(255, 255, 255, 0.82);
  backdrop-filter: blur(10px);
}
.tour__loader i {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--rgb);
  transform-origin: left;
}

.chapter {
  position: absolute;
  left: clamp(0.8rem, 2.4vw, 1.8rem);
  bottom: clamp(0.8rem, 2.4vw, 1.8rem);
  max-width: min(380px, calc(100% - 1.6rem));
  padding: 1.1rem 1.3rem 1.2rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.86);
  backdrop-filter: saturate(180%) blur(16px);
  -webkit-backdrop-filter: saturate(180%) blur(16px);
  box-shadow: 0 20px 40px -20px rgba(13, 16, 23, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.7);
}
.chapter__n {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: var(--accent-ink);
}
.chapter h3 {
  font-size: clamp(1.15rem, 2vw, 1.5rem);
  font-weight: 600;
  margin: 0.35rem 0 0.4rem;
}
.chapter p {
  font-size: 0.95rem;
  color: var(--muted);
  line-height: 1.5;
}
.chap-enter-active,
.chap-leave-active {
  transition: opacity 0.28s ease, transform 0.28s ease;
}
.chap-enter-from {
  opacity: 0;
  transform: translateY(14px);
}
.chap-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.tour__time {
  position: absolute;
  inset: auto 0 0 0;
  height: 4px;
  background: rgba(13, 16, 23, 0.08);
}
.tour__time i {
  display: block;
  height: 100%;
  background: var(--rgb);
  transform-origin: left;
}

@media (max-width: 700px) {
  .tour__steps {
    display: none;
  }
  .chapter p {
    font-size: 0.85rem;
  }
  .tour__stage {
    width: calc(100% - 1.5rem);
    aspect-ratio: auto;
    overflow: visible;
    background: none;
    box-shadow: none;
  }
  .tour__stage canvas {
    aspect-ratio: 16 / 9;
    height: auto;
    border-radius: 18px;
    background: #dcdde0;
    box-shadow: 0 20px 40px -24px rgba(13, 16, 23, 0.45), 0 0 0 1px var(--line);
  }
  .chapter {
    position: relative;
    left: auto;
    bottom: auto;
    max-width: none;
    margin-top: 0.9rem;
    background: var(--surface);
    box-shadow: none;
  }
  .tour__time {
    display: none;
  }
}
</style>
