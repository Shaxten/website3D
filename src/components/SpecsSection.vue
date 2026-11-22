<script setup>
// Source : fiche officielle Thermalright, https://www.thermalright.com/product/a70-vision-white/
const specs = [
  ['Dimensions (L × l × H)', '450,8 × 289,5 × 477 mm'],
  ['Poids net', '11,44 kg'],
  ['Matériaux', 'ABS, acier SPCC, verre trempé'],
  ['Cartes mères', 'ATX, Micro-ATX, Mini-ITX (connectique arrière acceptée)'],
  ['Alimentation', 'ATX, jusqu\'à 200 mm'],
  ['Cartes d\'extension', '7 emplacements PCIe'],
  ['Carte graphique', 'Jusqu\'à 420 mm'],
  ['Ventirad CPU', 'Hauteur max. 168,4 mm'],
  ['Ventilateurs', 'Fond 3 × 120 mm, côté 3 × 120 mm, arrière 2 × 120 mm'],
  ['Radiateurs', 'Fond et côté : 120, 240 ou 360 mm'],
  ['Stockage', '1 baie 3,5", 2 baies 2,5"'],
  ['Façade E/S', 'Bouton marche, prise casque, 2 USB Type-A, 1 USB Type-C'],
  ['Éclairage', 'ARGB adressable 3 broches, 5 V'],
]
</script>

<template>
  <section id="specs" class="section specs">
    <div class="wrap specs__grid">
      <header>
        <p class="eyebrow" v-reveal>Caractéristiques</p>
        <h2 class="title" v-reveal="{ delay: 60 }">Fiche technique</h2>
        <p class="lead" v-reveal="{ delay: 120 }">
          Les données viennent de la
          <a href="https://www.thermalright.com/product/a70-vision-white/" target="_blank" rel="noopener noreferrer">fiche officielle Thermalright</a>.
        </p>
      </header>

      <dl class="specs__list" v-reveal>
        <div v-for="[k, v] in specs" :key="k" class="specs__row">
          <dt>{{ k }}</dt>
          <dd>{{ v }}</dd>
        </div>
      </dl>
    </div>
  </section>
</template>

<style scoped>
.specs__grid {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: clamp(2rem, 6vw, 6rem);
  align-items: start;
}
.lead a {
  color: var(--accent-ink);
  text-underline-offset: 3px;
}
.specs__list {
  margin: 0;
  border-top: 1px solid var(--line);
}
.specs__row {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(0, 1.2fr);
  gap: 1.5rem;
  padding: 1.05rem 0.4rem;
  border-bottom: 1px solid var(--line);
  transition: background 0.2s;
}
.specs__row:hover {
  background: var(--surface);
}
.specs__row dt {
  color: var(--muted);
  font-size: 0.95rem;
}
.specs__row dd {
  margin: 0;
  font-weight: 500;
}
@media (max-width: 900px) {
  .specs__grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 520px) {
  .specs__row {
    grid-template-columns: 1fr;
    gap: 0.15rem;
  }
}
</style>
