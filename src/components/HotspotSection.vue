<script setup>
import { ref, computed } from 'vue'

const base = import.meta.env.BASE_URL

// Positions en % de l'image (1500 × 1500).
const spots = [
  {
    id: 'verre',
    x: 54.7,
    y: 20,
    title: 'Verre d\'angle',
    text: 'Deux panneaux de verre trempé se rejoignent sans montant. La vue sur l\'intérieur est continue.',
  },
  {
    id: 'ecran',
    x: 45.3,
    y: 33.3,
    title: 'Écran large',
    text: 'Un écran fixé sous le carénage haut affiche températures CPU et GPU, fréquences, mémoire et heure.',
  },
  {
    id: 'pompe',
    x: 36.7,
    y: 54,
    title: 'Écran sur le refroidisseur',
    text: 'Le bloc du watercooling intègre un petit écran pour l\'heure et des animations.',
  },
  {
    id: 'arriere',
    x: 21.3,
    y: 48,
    title: 'Ventilateurs arrière',
    text: 'Deux ventilateurs de 120 mm à l\'arrière évacuent l\'air chaud. Bordure lumineuse ARGB.',
  },
  {
    id: 'lateral',
    x: 73,
    y: 58,
    title: 'Ventilateurs latéraux',
    text: 'Trois emplacements de 120 mm sur le côté, compatibles avec un radiateur de 120, 240 ou 360 mm.',
  },
  {
    id: 'gpu',
    x: 43.3,
    y: 72.7,
    title: 'Carte graphique',
    text: 'Les cartes jusqu\'à 420 mm de long sont acceptées, au-dessus de trois ventilateurs de fond.',
  },
  {
    id: 'rgb',
    x: 30.7,
    y: 89.3,
    title: 'Éclairage ARGB',
    text: 'Un bandeau lumineux court le long du châssis. Il se pilote en ARGB adressable 3 broches, 5 V.',
  },
  {
    id: 'io',
    x: 73.3,
    y: 93.7,
    title: 'Ports en façade',
    text: 'Bouton marche, prise casque, deux USB Type-A et un USB Type-C.',
  },
]

const activeId = ref('ecran')
const active = computed(() => spots.find((s) => s.id === activeId.value))
const zoom = ref(1)
// Centre le point actif dans le cadre, sans jamais laisser de vide sur les bords.
const zoomTransform = computed(() => {
  const s = zoom.value
  const clamp = (v) => Math.min(0, Math.max(100 * (1 - s), v))
  const tx = clamp(50 - s * active.value.x)
  const ty = clamp(50 - s * active.value.y)
  return `translate(${tx}%, ${ty}%) scale(${s})`
})

function select(id) {
  activeId.value = id
  zoom.value = 1.7
}
function reset() {
  zoom.value = 1
}
</script>

<template>
  <section id="details" class="section details">
    <div class="wrap">
      <header class="details__head">
        <p class="eyebrow" v-reveal>Points d'intérêt</p>
        <h2 class="title" v-reveal="{ delay: 60 }">Touchez un point, le boîtier se rapproche</h2>
        <p class="lead" v-reveal="{ delay: 120 }">
          Huit zones à explorer sur la vue de face. Cliquez sur un repère ou choisissez dans la liste.
        </p>
      </header>

      <div class="details__grid">
        <div class="details__view" v-reveal>
          <div
            class="details__zoom"
            :style="{ '--zoom': zoom, transform: zoomTransform }"
          >
            <img
              :src="`${base}media/front.webp`"
              width="1500"
              height="1500"
              alt="Vue de face du boîtier A70 Vision White avec les points d'intérêt"
              loading="lazy"
            />
            <button
              v-for="s in spots"
              :key="s.id"
              type="button"
              class="spot"
              :class="{ on: s.id === activeId }"
              :style="{ left: s.x + '%', top: s.y + '%' }"
              :aria-label="s.title"
              :aria-pressed="s.id === activeId"
              @click="select(s.id)"
            >
              <i></i>
            </button>
          </div>
          <button v-if="zoom > 1" type="button" class="details__reset" @click="reset">
            Vue d'ensemble
          </button>
        </div>

        <div class="details__panel">
          <Transition name="fade" mode="out-in">
            <div :key="active.id" class="details__card">
              <h3>{{ active.title }}</h3>
              <p>{{ active.text }}</p>
            </div>
          </Transition>
          <ul class="details__list">
            <li v-for="(s, i) in spots" :key="s.id">
              <button type="button" :class="{ on: s.id === activeId }" @click="select(s.id)">
                <span>{{ String(i + 1).padStart(2, '0') }}</span>
                {{ s.title }}
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.details {
  background: var(--surface);
}
.details__grid {
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(0, 0.75fr);
  gap: clamp(1.5rem, 4vw, 4rem);
  margin-top: 3.5rem;
  align-items: start;
}
.details__view {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius);
  background: #fff;
  overflow: hidden;
  box-shadow: 0 30px 60px -36px rgba(13, 16, 23, 0.35), 0 0 0 1px var(--line);
}
.details__zoom {
  position: absolute;
  inset: 0;
  transform-origin: 0 0;
  transition: transform 0.9s cubic-bezier(0.22, 0.8, 0.25, 1);
}
.details__zoom img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.spot {
  position: absolute;
  width: 44px;
  height: 44px;
  margin: -22px 0 0 -22px;
  padding: 0;
  border: 0;
  background: transparent;
  cursor: pointer;
  /* garde la taille des repères constante malgré le zoom */
  transform: scale(calc(1 / var(--zoom, 1)));
  transition: transform 0.9s cubic-bezier(0.22, 0.8, 0.25, 1);
}
.spot i {
  position: absolute;
  inset: 11px;
  border-radius: 50%;
  background: var(--accent);
  border: 3px solid #fff;
  box-shadow: 0 4px 14px rgba(29, 127, 224, 0.55);
  transition: background 0.2s, transform 0.2s;
}
.spot i::after {
  content: '';
  position: absolute;
  inset: -10px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  opacity: 0;
  animation: ping 2.2s ease-out infinite;
}
.spot:hover i {
  transform: scale(1.2);
}
.spot.on i {
  background: var(--ink);
  box-shadow: 0 4px 14px rgba(13, 16, 23, 0.5);
}
.spot.on i::after {
  border-color: var(--ink);
}
@keyframes ping {
  0% {
    transform: scale(0.6);
    opacity: 0.9;
  }
  100% {
    transform: scale(1.6);
    opacity: 0;
  }
}

.details__reset {
  position: absolute;
  right: 1rem;
  top: 1rem;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  border: 1px solid var(--line);
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
}
.details__reset:hover {
  border-color: var(--ink);
}

.details__card {
  padding: 1.8rem;
  border-radius: 24px;
  background: #fff;
  box-shadow: 0 0 0 1px var(--line);
  min-height: 11.5rem;
}
.details__card h3 {
  font-size: 1.7rem;
  font-weight: 600;
}
.details__card p {
  margin-top: 0.8rem;
  color: var(--muted);
}
.details__list {
  list-style: none;
  margin: 1.2rem 0 0;
  padding: 0;
  display: grid;
  gap: 0.35rem;
}
.details__list button {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  width: 100%;
  padding: 0.7rem 1rem;
  border: 0;
  border-radius: 14px;
  background: transparent;
  text-align: left;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.2s;
}
.details__list button span {
  font-family: var(--font-display);
  font-size: 0.8rem;
  color: var(--muted);
}
.details__list button:hover {
  background: var(--surface-2);
}
.details__list button.on {
  background: var(--ink);
  color: #fff;
}
.details__list button.on span {
  color: #aab3c2;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

@media (max-width: 900px) {
  .details__grid {
    grid-template-columns: 1fr;
  }
}
@media (prefers-reduced-motion: reduce) {
  .details__zoom,
  .spot {
    transition: none;
  }
  .spot i::after {
    animation: none;
  }
}
</style>
