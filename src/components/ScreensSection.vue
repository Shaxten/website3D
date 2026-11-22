<script setup>
const base = import.meta.env.BASE_URL
</script>

<template>
  <section id="ecrans" class="section screens">
    <div class="wrap">
      <header class="screens__head">
        <p class="eyebrow" v-reveal>Écrans intégrés</p>
        <h2 class="title" v-reveal="{ delay: 60 }">L'état de la machine, en direct</h2>
        <p class="lead" v-reveal="{ delay: 120 }">
          Températures, fréquences, charge mémoire et heure s'affichent sur les écrans du boîtier,
          visibles à travers la vitre.
        </p>
      </header>

      <div class="screens__grid">
        <figure class="card card--a" v-tilt="{ max: 4 }" v-reveal>
          <img
            :src="`${base}media/screen-a.webp`"
            width="1200"
            height="928"
            alt="Gros plan sur l'écran du boîtier : température CPU, fréquence, vitesse du ventilateur, mémoire et heure"
            loading="lazy"
          />
          <figcaption>
            <b>Écran large</b>
            <span>CPU, ventilateurs, mémoire, heure</span>
          </figcaption>
        </figure>
        <figure class="card card--b" v-tilt="{ max: 4 }" v-reveal="{ delay: 120 }">
          <img
            :src="`${base}media/screen-b.webp`"
            width="1200"
            height="928"
            alt="Vue de dessus des deux écrans : bandeau CPU/GPU/RAM et écran du bloc de refroidissement affichant l'heure"
            loading="lazy"
          />
          <figcaption>
            <b>Vue de dessus</b>
            <span>Bandeau CPU/GPU/RAM et écran du refroidisseur</span>
          </figcaption>
        </figure>
      </div>
    </div>
  </section>
</template>

<style scoped>
.screens__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(1rem, 2.4vw, 2rem);
  margin-top: 3.5rem;
}
.card {
  position: relative;
  margin: 0;
  border-radius: var(--radius);
  overflow: hidden;
  background: var(--surface);
  box-shadow: 0 30px 60px -36px rgba(13, 16, 23, 0.4), 0 0 0 1px var(--line);
}
.card img {
  width: 100%;
  height: auto;
  aspect-ratio: 1200 / 928;
  object-fit: cover;
  transition: transform 0.8s cubic-bezier(0.2, 0.7, 0.2, 1);
}
.card:hover img {
  transform: scale(1.04);
}
.card figcaption {
  position: absolute;
  left: 0.9rem;
  bottom: 0.9rem;
  display: flex;
  flex-direction: column;
  padding: 0.7rem 1rem;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.88);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
}
.card figcaption b {
  font-family: var(--font-display);
  font-size: 1.05rem;
}
.card figcaption span {
  font-size: 0.85rem;
  color: var(--muted);
}
/* Les deux cartes sont décalées verticalement pour un effet de profondeur */
@media (min-width: 801px) {
  .card--b {
    margin-top: 4rem;
  }
}
@media (max-width: 800px) {
  .screens__grid {
    grid-template-columns: 1fr;
  }
}
</style>
