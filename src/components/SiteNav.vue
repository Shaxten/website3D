<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const progress = ref(0)
const scrolled = ref(false)

const links = [
  { href: '#tour', label: 'Visite 360°' },
  { href: '#composants', label: 'Composants' },
  { href: '#details', label: 'Détails' },
  { href: '#ecrans', label: 'Écrans' },
  { href: '#angles', label: 'Angles' },
  { href: '#video', label: 'Vidéo' },
  { href: '#specs', label: 'Caractéristiques' },
]

let ticking = false
function update() {
  const max = document.documentElement.scrollHeight - window.innerHeight
  progress.value = max > 0 ? Math.min(1, window.scrollY / max) : 0
  scrolled.value = window.scrollY > 8
  ticking = false
}
function onScroll() {
  if (!ticking) {
    ticking = true
    requestAnimationFrame(update)
  }
}
onMounted(() => {
  update()
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
})
onBeforeUnmount(() => {
  window.removeEventListener('scroll', onScroll)
  window.removeEventListener('resize', onScroll)
})
</script>

<template>
  <header class="nav" :class="{ 'nav--scrolled': scrolled }">
    <div class="wrap nav__inner">
      <a href="#top" class="nav__brand" aria-label="A70 Vision White, retour en haut">
        <span class="nav__logo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="26" height="26"><rect width="32" height="32" rx="8" fill="#1d7fe0" /><path d="M9 10h14v4H18v9h-4v-9H9z" fill="#fff" /></svg>
        </span>
        <span>A70 <b>Vision</b></span>
      </a>
      <nav class="nav__links" aria-label="Sections">
        <a v-for="l in links" :key="l.href" :href="l.href">{{ l.label }}</a>
      </nav>
    </div>
    <div class="nav__bar" :style="{ transform: `scaleX(${progress})` }" aria-hidden="true"></div>
  </header>
</template>

<style scoped>
.nav {
  position: fixed;
  inset: 0 0 auto 0;
  height: var(--nav-h);
  z-index: 50;
  display: flex;
  align-items: center;
  transition: background 0.3s ease, box-shadow 0.3s ease, backdrop-filter 0.3s ease;
}
.nav--scrolled {
  background: rgba(255, 255, 255, 0.78);
  backdrop-filter: saturate(180%) blur(18px);
  -webkit-backdrop-filter: saturate(180%) blur(18px);
  box-shadow: 0 1px 0 var(--line);
}
.nav__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
}
.nav__brand {
  display: inline-flex;
  align-items: center;
  gap: 0.6rem;
  font-family: var(--font-display);
  font-weight: 500;
  font-size: 1.15rem;
  letter-spacing: -0.02em;
  text-decoration: none;
}
.nav__brand b {
  font-weight: 700;
}
.nav__logo {
  display: grid;
}
.nav__links {
  display: flex;
  gap: 0.25rem;
}
.nav__links a {
  padding: 0.5rem 0.85rem;
  border-radius: 999px;
  font-size: 0.92rem;
  font-weight: 500;
  color: var(--muted);
  text-decoration: none;
  transition: color 0.2s, background 0.2s;
}
.nav__links a:hover {
  color: var(--ink);
  background: var(--surface);
}
.nav__bar {
  position: absolute;
  left: 0;
  bottom: 0;
  height: 3px;
  width: 100%;
  background: var(--rgb);
  transform-origin: left;
  will-change: transform;
}
@media (max-width: 860px) {
  .nav__links {
    display: none;
  }
}
</style>
