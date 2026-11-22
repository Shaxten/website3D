<script setup>
const base = import.meta.env.BASE_URL
</script>

<template>
  <section id="top" class="hero">
    <div class="hero__ghost" aria-hidden="true">A70</div>

    <div class="wrap hero__grid">
      <div class="hero__copy">
        <p class="eyebrow" v-reveal>Thermalright · Boîtier PC</p>
        <h1 class="hero__title" v-reveal="{ delay: 80 }">
          A70 <span>Vision</span><br />White
        </h1>
        <p class="lead" v-reveal="{ delay: 160 }">
          Un boîtier panoramique où tout se voit : ventilateurs, écrans intégrés et éclairage ARGB
          derrière une vitre d'angle sans montant.
        </p>
        <div class="hero__cta" v-reveal="{ delay: 240 }">
          <a class="btn btn--primary" href="#tour">
            Lancer la visite
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 5v14M6 13l6 6 6-6" /></svg>
          </a>
          <a class="btn btn--ghost" href="#specs">Caractéristiques</a>
        </div>
        <ul class="hero__facts" v-reveal="{ delay: 320 }">
          <li><b>420 mm</b><span>carte graphique max</span></li>
          <li><b>360 mm</b><span>radiateur latéral</span></li>
          <li><b>8 × 120 mm</b><span>emplacements ventilateurs</span></li>
        </ul>
      </div>

      <div class="hero__visual" v-tilt="{ max: 5 }" v-reveal="{ delay: 120 }">
        <img
          class="hero__img"
          :src="`${base}media/front.webp`"
          width="1500"
          height="1500"
          alt="Boîtier Thermalright A70 Vision White vu de face, ventilateurs blancs et éclairage ARGB visibles à travers la vitre"
          fetchpriority="high"
        />
        <div class="hero__glow" aria-hidden="true"></div>
        <div class="hero__shadow" aria-hidden="true"></div>
      </div>
    </div>

    <a class="hero__scroll" href="#tour" aria-label="Aller à la visite">
      <span></span>
    </a>
  </section>
</template>

<style scoped>
.hero {
  position: relative;
  min-height: 100svh;
  display: flex;
  align-items: center;
  padding: calc(var(--nav-h) + 1.5rem) 0 4rem;
  overflow: hidden;
  background: #fff;
}
.hero__ghost {
  position: absolute;
  right: -2vw;
  top: 50%;
  transform: translateY(-52%);
  font-family: var(--font-display);
  font-weight: 700;
  font-size: clamp(14rem, 34vw, 34rem);
  letter-spacing: -0.06em;
  line-height: 0.8;
  color: transparent;
  -webkit-text-stroke: 2px #e9ecf2;
  user-select: none;
  pointer-events: none;
}
.hero__grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
  align-items: center;
  gap: clamp(1rem, 4vw, 4rem);
}
.hero__title {
  font-size: clamp(3.4rem, 8.6vw, 7.5rem);
  font-weight: 600;
  margin-top: 1.25rem;
}
.hero__title span {
  background: var(--rgb);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}
.hero__cta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 2.2rem;
}
.hero__facts {
  list-style: none;
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem 2.4rem;
  padding: 0;
  margin: 2.8rem 0 0;
}
.hero__facts li {
  display: flex;
  flex-direction: column;
}
.hero__facts b {
  font-family: var(--font-display);
  font-size: 1.5rem;
  letter-spacing: -0.02em;
}
.hero__facts span {
  font-size: 0.85rem;
  color: var(--muted);
}

.hero__visual {
  position: relative;
  transform-style: preserve-3d;
}
.hero__img {
  position: relative;
  width: 100%;
  height: auto;
  animation: float 7s ease-in-out infinite;
}
/* Posé au-dessus de l'image en multiply : le blanc de l'image prend la teinte du halo,
   ce qui supprime tout bord rectangulaire visible. */
.hero__glow {
  position: absolute;
  inset: 12% 8% 4%;
  background: var(--rgb);
  filter: blur(80px);
  opacity: 0.2;
  border-radius: 50%;
  mix-blend-mode: multiply;
  pointer-events: none;
}
.hero__shadow {
  position: absolute;
  left: 14%;
  right: 8%;
  bottom: 3%;
  height: 5%;
  background: radial-gradient(closest-side, rgba(13, 16, 23, 0.28), transparent);
  filter: blur(6px);
  animation: shadow 7s ease-in-out infinite;
}
@keyframes float {
  50% {
    transform: translateY(-10px);
  }
}
@keyframes shadow {
  50% {
    transform: scaleX(0.94);
    opacity: 0.7;
  }
}

.hero__scroll {
  position: absolute;
  left: 50%;
  bottom: 1.4rem;
  width: 26px;
  height: 42px;
  margin-left: -13px;
  border: 2px solid #c7ccd6;
  border-radius: 14px;
}
.hero__scroll span {
  position: absolute;
  left: 50%;
  top: 8px;
  width: 4px;
  height: 8px;
  margin-left: -2px;
  border-radius: 4px;
  background: var(--ink);
  animation: cue 1.8s ease-in-out infinite;
}
@keyframes cue {
  0% {
    opacity: 0;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(14px);
  }
}

@media (max-width: 900px) {
  .hero__grid {
    grid-template-columns: 1fr;
  }
  .hero__visual {
    order: -1;
    max-width: 560px;
    margin-inline: auto;
  }
  .hero {
    align-items: flex-start;
  }
  .hero__scroll {
    display: none;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hero__img,
  .hero__shadow,
  .hero__scroll span {
    animation: none;
  }
}
</style>
