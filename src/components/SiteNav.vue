<script setup>
import { ref, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { scrollToY } from '../state.js'

const progress = ref(0)
const current = ref('')
const open = ref(false)
const linksEl = ref(null)
const pill = ref({ x: 0, y: 0, w: 0, h: 0, on: false })

const links = [
  { href: '#composants', label: 'Composants' },
  { href: '#angles', label: 'Angles' },
  { href: '#video', label: 'Vidéo' },
  { href: '#specs', label: 'Caractéristiques' },
]

// Section en cours de lecture : celle qui occupe le milieu de l'écran.
function spy() {
  const mid = window.innerHeight * 0.5
  let id = ''
  for (const l of links) {
    const el = document.querySelector(l.href)
    if (!el) continue
    const r = el.getBoundingClientRect()
    if (r.top <= mid && r.bottom > mid) id = l.href
  }
  current.value = id
  const a = id && linksEl.value?.querySelector(`a[href="${id}"]`)
  pill.value = a
    ? { x: a.offsetLeft, y: a.offsetTop, w: a.offsetWidth, h: a.offsetHeight, on: true }
    : { ...pill.value, on: false }
}

watch(open, () => nextTick(spy))

let ticking = false
function update() {
  spy()
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(1, window.scrollY / max) : 0
  ticking = false
}
function onScroll() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(update)
  }
}
function toTop() {
  open.value = false
  scrollToY(0)
}
function onKey(e) {
  if (e.key === 'Escape') open.value = false
}

onMounted(() => {
  update()
  document.fonts?.ready.then(update)
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  window.addEventListener('keydown', onKey)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
  window.removeEventListener('keydown', onKey)
})

// Anneau de progression autour du logo
const R = 19
const C = 2 * Math.PI * R
</script>

<template>
  <div class="topbar rgb-flow" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true"></div>

  <header class="dock" :class="{ open }">
    <button type="button" class="dock__logo" aria-label="Retour en haut" @click="toTop">
      <svg class="dock__ring" viewBox="0 0 44 44" aria-hidden="true">
        <defs>
          <linearGradient id="dock-rgb" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0" stop-color="#ff2d95" />
            <stop offset="0.35" stop-color="#ffd400" />
            <stop offset="0.65" stop-color="#19b6ff" />
            <stop offset="1" stop-color="#7b4dff" />
          </linearGradient>
        </defs>
        <circle cx="22" cy="22" :r="R" class="track" />
        <circle cx="22" cy="22" :r="R" class="val" :stroke-dasharray="`${(progress * C).toFixed(1)} ${C.toFixed(1)}`" />
      </svg>
      <svg viewBox="0 0 32 32" width="22" height="22" aria-hidden="true"><rect width="32" height="32" rx="8" fill="#1d7fe0" /><path d="M9 10h14v4H18v9h-4v-9H9z" fill="#fff" /></svg>
    </button>

    <nav id="dock-links" ref="linksEl" class="dock__links" aria-label="Sections">
      <span
        class="dock__pill"
        :class="{ on: pill.on }"
        :style="{ transform: `translate(${pill.x}px, ${pill.y}px)`, width: `${pill.w}px`, height: `${pill.h}px` }"
        aria-hidden="true"
      ></span>
      <a
        v-for="l in links"
        :key="l.href"
        :href="l.href"
        :class="{ active: current === l.href }"
        :aria-current="current === l.href ? 'location' : undefined"
        @click="open = false"
      >{{ l.label }}</a>
    </nav>

    <button
      type="button"
      class="dock__toggle"
      :aria-expanded="open"
      aria-controls="dock-links"
      :aria-label="open ? 'Fermer le menu' : 'Ouvrir le menu'"
      @click="open = !open"
    >
      <span></span><span></span>
    </button>
  </header>
</template>

<style scoped>
.topbar {
  position: fixed;
  inset: 0 0 auto 0;
  z-index: 60;
  height: 3px;
  background: var(--rgb);
  transform-origin: left;
  will-change: transform;
}

.dock {
  position: fixed;
  right: clamp(0.75rem, 2vw, 1.5rem);
  bottom: clamp(0.75rem, 2vw, 1.5rem);
  z-index: 60;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  padding: 0.35rem;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: saturate(180%) blur(18px);
  -webkit-backdrop-filter: saturate(180%) blur(18px);
  box-shadow:
    0 20px 40px -18px rgba(13, 16, 23, 0.45),
    0 0 0 1px rgba(13, 16, 23, 0.08);
  animation: dock-in 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.4s both;
}
@keyframes dock-in {
  from {
    opacity: 0;
    transform: translateY(30px) scale(0.9);
  }
}
:global(.is-loading) .dock {
  animation-play-state: paused;
}

.dock__logo {
  position: relative;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: #fff;
  cursor: pointer;
  flex: none;
}
.dock__ring {
  position: absolute;
  inset: 0;
  transform: rotate(-90deg);
}
.dock__ring circle {
  fill: none;
  stroke-width: 3;
}
.dock__ring .track {
  stroke: var(--surface-2);
}
.dock__ring .val {
  stroke: url(#dock-rgb);
  stroke-linecap: round;
}

.dock__links {
  position: relative;
  display: flex;
  gap: 0.15rem;
}
.dock__pill {
  position: absolute;
  left: 0;
  top: 0;
  border-radius: 999px;
  background: var(--ink);
  opacity: 0;
  transition:
    transform 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
    width 0.45s cubic-bezier(0.2, 0.8, 0.2, 1),
    opacity 0.3s;
}
.dock__pill.on {
  opacity: 1;
}
.dock__links a {
  position: relative;
  padding: 0.6rem 0.95rem;
  border-radius: 999px;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
  white-space: nowrap;
  transition:
    color 0.2s,
    background 0.2s;
}
.dock__links a:hover {
  color: var(--ink);
  background: var(--surface);
}
.dock__links a.active,
.dock__links a.active:hover {
  color: #fff;
  background: transparent;
}

.dock__toggle {
  display: none;
}

/* Mobile : logo + bouton menu, les liens se déplient vers le haut */
@media (max-width: 700px) {
  .dock {
    flex-wrap: wrap-reverse;
    justify-content: flex-end;
    max-width: calc(100vw - 1.5rem);
    border-radius: 26px;
  }
  .dock__links {
    display: none;
    flex-basis: 100%;
    flex-direction: column;
    padding: 0.2rem 0.2rem 0.4rem;
  }
  .dock.open .dock__links {
    display: flex;
  }
  .dock__links a {
    padding: 0.75rem 1.1rem;
    font-size: 1rem;
  }
  .dock__toggle {
    display: grid;
    place-content: center;
    gap: 5px;
    width: 44px;
    height: 44px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: var(--ink);
    cursor: pointer;
  }
  .dock__toggle span {
    display: block;
    width: 18px;
    height: 2px;
    border-radius: 2px;
    background: #fff;
    transition: transform 0.3s;
  }
  .dock.open .dock__toggle span:first-child {
    transform: translateY(3.5px) rotate(45deg);
  }
  .dock.open .dock__toggle span:last-child {
    transform: translateY(-3.5px) rotate(-45deg);
  }
}
@media (prefers-reduced-motion: reduce) {
  .dock,
  .dock__pill {
    animation: none;
    transition: none;
  }
}
</style>
