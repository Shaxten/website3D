<script setup>
import { ref } from 'vue'

const base = import.meta.env.BASE_URL

const shots = [
  {
    src: 'iso.webp',
    title: 'Vue plongeante',
    text: 'La carte graphique, les deux écrans et les ventilateurs de fond vus d\'en haut.',
    alt: 'Boîtier A70 Vision White en vue isométrique sur fond blanc',
  },
  {
    src: 'exploded.webp',
    title: 'Accès à l\'intérieur',
    text: 'Les vitres et les panneaux se détachent du châssis pour monter la machine.',
    alt: 'Vue éclatée du boîtier avec les panneaux et les vitres écartés, flèches bleues',
  },
  {
    src: 'airflow.webp',
    title: 'Circulation d\'air',
    text: 'Ventilation côté et fond, avec huit emplacements de 120 mm au total.',
    alt: 'Boîtier dont les ventilateurs sont surlignés en bleu clair',
  },
  {
    src: 'dark.webp',
    title: 'En ambiance sombre',
    text: 'Le blanc ressort sur un décor noir, les liserés ARGB prennent le relais.',
    alt: 'Boîtier blanc posé sur un décor noir, liserés ARGB allumés',
  },
]

const current = ref(0)
</script>

<template>
  <section id="angles" class="section angles">
    <div class="wrap">
      <header>
        <p class="eyebrow" v-reveal>Autres angles</p>
        <h2 class="title" v-reveal="{ delay: 60 }">Le boîtier sous toutes les coutures</h2>
      </header>

      <div class="angles__layout">
        <div class="angles__stage" v-tilt="{ max: 3 }" v-reveal>
          <Transition name="swap" mode="out-in">
            <img
              :key="shots[current].src"
              :src="`${base}media/${shots[current].src}`"
              width="1400"
              height="1400"
              :alt="shots[current].alt"
            />
          </Transition>
        </div>

        <ul class="angles__list">
          <li v-for="(s, i) in shots" :key="s.src" v-reveal="{ delay: i * 70 }">
            <button
              type="button"
              :class="{ on: i === current }"
              :aria-pressed="i === current"
              @click="current = i"
              @mouseenter="current = i"
              @focus="current = i"
            >
              <img :src="`${base}media/${s.src}`" alt="" width="96" height="96" loading="lazy" />
              <span>
                <b>{{ s.title }}</b>
                <small>{{ s.text }}</small>
              </span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </section>
</template>

<style scoped>
.angles {
  background: var(--surface);
}
.angles__layout {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  align-items: center;
  margin-top: 3.5rem;
}
.angles__stage {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius);
  overflow: hidden;
  background: #fff;
  box-shadow: 0 30px 60px -36px rgba(13, 16, 23, 0.4), 0 0 0 1px var(--line);
}
.angles__stage img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.swap-enter-active,
.swap-leave-active {
  transition: opacity 0.35s ease, transform 0.5s ease;
}
.swap-enter-from {
  opacity: 0;
  transform: scale(1.04);
}
.swap-leave-to {
  opacity: 0;
}

.angles__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.8rem;
}
.angles__list button {
  display: grid;
  grid-template-columns: 84px 1fr;
  align-items: center;
  gap: 1.1rem;
  width: 100%;
  padding: 0.75rem;
  border: 0;
  border-radius: 20px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  box-shadow: 0 0 0 1px transparent;
  transition: background 0.25s, box-shadow 0.25s;
}
.angles__list button.on {
  background: #fff;
  box-shadow: 0 0 0 1px var(--line), 0 18px 36px -24px rgba(13, 16, 23, 0.4);
}
.angles__list img {
  width: 84px;
  height: 84px;
  border-radius: 14px;
  object-fit: cover;
  background: #fff;
}
.angles__list b {
  display: block;
  font-family: var(--font-display);
  font-size: 1.15rem;
  letter-spacing: -0.02em;
}
.angles__list small {
  display: block;
  margin-top: 0.15rem;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--muted);
}
@media (max-width: 900px) {
  .angles__layout {
    grid-template-columns: 1fr;
  }
}
</style>
