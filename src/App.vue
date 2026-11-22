<script setup>
import SiteNav from './components/SiteNav.vue'
import HeroSection from './components/HeroSection.vue'
import TourSection from './components/TourSection.vue'
import ExplodedSection from './components/ExplodedSection.vue'
import HotspotSection from './components/HotspotSection.vue'
import ScreensSection from './components/ScreensSection.vue'
import AnglesSection from './components/AnglesSection.vue'
import VideoSection from './components/VideoSection.vue'
import SpecsSection from './components/SpecsSection.vue'
import SiteFooter from './components/SiteFooter.vue'
</script>

<template>
  <SiteNav />
  <main>
    <HeroSection />
    <TourSection />
    <ExplodedSection />
    <HotspotSection />
    <ScreensSection />
    <AnglesSection />
    <VideoSection />
    <SpecsSection />
  </main>
  <SiteFooter />
</template>
