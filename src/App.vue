<script setup>
import SiteLoader from './components/SiteLoader.vue'
import SiteNav from './components/SiteNav.vue'
import ExplodedSection from './components/ExplodedSection.vue'
import MarqueeBand from './components/MarqueeBand.vue'
import AnglesSection from './components/AnglesSection.vue'
import VideoSection from './components/VideoSection.vue'
import SpecsSection from './components/SpecsSection.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <SiteLoader />
  <SiteNav />
  <main>
    <ExplodedSection />
    <MarqueeBand />
    <AnglesSection />
    <VideoSection />
    <SpecsSection />
  </main>
  <SiteFooter />
</template>
