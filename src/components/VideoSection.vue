<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const base = import.meta.env.BASE_URL
const video = ref(null)
let io = null
let userPaused = false

// La vidéo démarre en sourdine quand elle arrive à l'écran et se met en pause quand on la quitte.
// Si le visiteur la met en pause lui-même, on ne la relance plus automatiquement.
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const v = video.value
  v.addEventListener('pause', () => {
    if (v.dataset.auto !== '1' && !v.ended) userPaused = true
    v.dataset.auto = ''
  })
  io = new IntersectionObserver(
    ([e]) => {
      if (e.isIntersecting && !userPaused) {
        v.play().catch(() => {})
      } else if (!e.isIntersecting && !v.paused) {
        v.dataset.auto = '1'
        v.pause()
      }
    },
    { threshold: 0.45 },
  )
  io.observe(v)
})
onBeforeUnmount(() => io?.disconnect())
</script>

<template>
  <section id="video" class="section video">
    <div class="wrap">
      <header class="video__head">
        <p class="eyebrow" v-reveal>Vidéo</p>
        <h2 class="title" v-reveal="{ delay: 60 }">Le boîtier en mouvement</h2>
      </header>
      <div class="video__frame" v-reveal>
        <video
          ref="video"
          controls
          muted
          loop
          playsinline
          preload="none"
          :poster="`${base}media/poster.webp`"
          aria-label="Vidéo de présentation du boîtier A70 Vision White"
        >
          <source :src="`${base}media/showcase.mp4`" type="video/mp4" />
          Votre navigateur ne sait pas lire cette vidéo.
        </video>
      </div>
    </div>
  </section>
</template>

<style scoped>
.video__frame {
  margin-top: 3rem;
  border-radius: var(--radius);
  overflow: hidden;
  background: #dcdde0;
  box-shadow: 0 40px 80px -40px rgba(13, 16, 23, 0.5), 0 0 0 1px var(--line);
}
.video__frame video {
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}
</style>
