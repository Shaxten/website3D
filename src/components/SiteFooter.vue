<template>
  <footer class="foot">
    <div class="foot__rgb rgb-flow" aria-hidden="true"></div>
    <div class="wrap foot__inner">
      <p><b>A70 Vision White</b> · Projet de démonstration personnel</p>
      <p class="foot__legal">
        Thermalright et A70 Vision sont des marques de leurs propriétaires. Les images et la vidéo
        proviennent de Thermalright. Ce site n'est pas affilié à la marque.
      </p>
    </div>
  </footer>
</template>

<style scoped>
.foot {
  position: relative;
  padding: 3.5rem 0 6.5rem;
  border-top: 1px solid var(--line);
}
.foot__rgb {
  position: absolute;
  inset: -2px 0 auto 0;
  height: 3px;
  background: var(--rgb);
}
.foot__inner {
  display: grid;
  gap: 0.6rem;
}
.foot__legal {
  max-width: 70ch;
  font-size: 0.85rem;
  color: var(--muted);
}
</style>
