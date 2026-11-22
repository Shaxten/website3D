<script setup>
const base = import.meta.env.BASE_URL
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
          controls
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
