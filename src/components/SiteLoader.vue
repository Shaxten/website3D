<script setup>
import { ref, onMounted } from 'vue'
import { loaded, reduceMotion, lenis } from '../state.js'

const base = import.meta.env.BASE_URL

// Images nécessaires à la première scène : on les charge avant d'ouvrir le rideau.
const assets = ['front', 'parts/screen', 'parts/pump', 'parts/rear-fans', 'parts/side-fans', 'parts/gpu'].map(
  (n) => `${base}media/${n}.webp`,
)

const progress = ref(0)
const leaving = ref(false)
const gone = ref(false)

function load(src) {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => {
      progress.value += 1 / (assets.length + 1)
      resolve()
    }
    img.src = src
  })
}

onMounted(async () => {
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  if (!location.hash) window.scrollTo(0, 0)
  document.documentElement.classList.add('is-loading')
  lenis?.stop()

  const minTime = new Promise((r) => setTimeout(r, reduceMotion ? 0 : 1300))
  const fonts = (document.fonts?.ready ?? Promise.resolve()).then(() => (progress.value += 1 / (assets.length + 1)))
  // Au pire, on ouvre au bout de 8 s même si une image traîne.
  const timeout = new Promise((r) => setTimeout(r, 8000))
  await Promise.race([Promise.all([...assets.map(load), fonts]), timeout])
  await minTime
  progress.value = 1

  setTimeout(
    () => {
      leaving.value = true
      document.documentElement.classList.remove('is-loading')
      lenis?.start()
      loaded.value = true
      setTimeout(() => (gone.value = true), 1200)
    },
    reduceMotion ? 0 : 350,
  )
})
</script>

<template>
  <div v-if="!gone" class="loader" :class="{ out: leaving }" role="status" aria-live="polite">
    <div class="loader__inner">
      <div class="loader__logo" aria-hidden="true">
        <span class="loader__outline">A70</span>
        <span class="loader__fill rgb-flow" :style="{ clipPath: `inset(${(100 - progress * 100).toFixed(1)}% 0 0 0)` }">A70</span>
      </div>
      <p class="loader__sub">Vision <b>White</b></p>
      <div class="loader__bar" aria-hidden="true">
        <i class="rgb-flow" :style="{ transform: `scaleX(${progress})` }"></i>
      </div>
      <p class="loader__pct">
        <span class="visually-hidden">Chargement</span>{{ Math.round(progress * 100) }} %
      </p>
    </div>
  </div>
</template>

<style scoped>
.loader {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: grid;
  place-items: center;
  background: #fff;
  clip-path: inset(0 0 0 0);
  transition: clip-path 1s cubic-bezier(0.76, 0, 0.24, 1);
}
/* Le rideau remonte et dévoile la scène */
.loader.out {
  clip-path: inset(0 0 100% 0);
}
.loader__inner {
  display: grid;
  justify-items: center;
  transition:
    transform 0.9s cubic-bezier(0.76, 0, 0.24, 1),
    opacity 0.6s;
}
.loader.out .loader__inner {
  transform: translateY(-14vh) scale(0.9);
  opacity: 0;
}
.loader__logo {
  position: relative;
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(6rem, 22vw, 13rem);
  letter-spacing: -0.06em;
  line-height: 0.9;
}
.loader__outline {
  color: transparent;
  -webkit-text-stroke: 2px #d9dde5;
}
.loader__fill {
  position: absolute;
  inset: 0;
  background: var(--rgb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  transition: clip-path 0.5s ease;
}
.loader__sub {
  margin-top: 0.6rem;
  font-family: var(--font-display);
  font-size: 0.95rem;
  letter-spacing: 0.45em;
  text-transform: uppercase;
  color: var(--muted);
}
.loader__sub b {
  color: var(--ink);
  font-weight: 600;
}
.loader__bar {
  width: min(260px, 60vw);
  height: 3px;
  margin-top: 2rem;
  border-radius: 3px;
  background: var(--surface-2);
  overflow: hidden;
}
.loader__bar i {
  display: block;
  height: 100%;
  background: var(--rgb);
  transform-origin: left;
  transition: transform 0.5s ease;
}
.loader__pct {
  margin-top: 0.7rem;
  font-family: var(--font-display);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  color: var(--muted);
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
}
@media (prefers-reduced-motion: reduce) {
  .loader,
  .loader__inner {
    transition: none;
  }
}
</style>
