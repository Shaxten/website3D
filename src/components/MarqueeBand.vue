<script setup>
const items = [
  'Verre d\'angle sans montant',
  'ARGB adressable 5 V',
  'GPU jusqu\'à 420 mm',
  'Écran 9,16 pouces',
  '8 ventilateurs de 120 mm',
  'Radiateur 360 mm',
  'USB Type-C en façade',
  'ATX · Micro-ATX · Mini-ITX',
]
</script>

<template>
  <div class="band">
    <p class="visually-hidden">{{ items.join(', ') }}</p>
    <div class="band__track" aria-hidden="true">
      <!-- Deux copies identiques : la piste défile de la moitié de sa largeur, puis recommence. -->
      <ul v-for="n in 2" :key="n">
        <li v-for="(t, i) in items" :key="t">
          <i :style="{ '--d': `${i * -0.5}s` }"></i>{{ t }}
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.band {
  position: relative;
  overflow: hidden;
  padding: 1.1rem 0;
  background: var(--ink);
  color: #fff;
  /* bords fondus */
  -webkit-mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
  mask-image: linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent);
}
.band__track {
  display: flex;
  width: max-content;
  animation: slide 38s linear infinite;
}
.band:hover .band__track {
  animation-play-state: paused;
}
.band ul {
  display: flex;
  list-style: none;
  margin: 0;
  padding: 0;
}
.band li {
  display: inline-flex;
  align-items: center;
  gap: 1.1rem;
  padding-right: 2.6rem;
  font-family: var(--font-display);
  font-size: clamp(1.05rem, 2vw, 1.4rem);
  font-weight: 500;
  letter-spacing: -0.01em;
  white-space: nowrap;
}
/* Petite LED qui change de couleur, décalée pour chaque élément */
.band i {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #19b6ff;
  box-shadow: 0 0 12px currentColor;
  animation: led 4s linear infinite;
  animation-delay: var(--d);
}
@keyframes slide {
  to {
    transform: translateX(-50%);
  }
}
@keyframes led {
  0%,
  100% {
    background: #ff2d95;
    color: #ff2d95;
  }
  20% {
    background: #ff7a00;
    color: #ff7a00;
  }
  40% {
    background: #ffd400;
    color: #ffd400;
  }
  60% {
    background: #2ee66b;
    color: #2ee66b;
  }
  80% {
    background: #19b6ff;
    color: #19b6ff;
  }
}
.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
@media (prefers-reduced-motion: reduce) {
  .band__track,
  .band i {
    animation: none;
  }
  .band__track {
    flex-wrap: wrap;
    width: auto;
  }
  .band ul + ul {
    display: none;
  }
}
</style>
