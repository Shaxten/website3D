import { ref } from 'vue'
import Lenis from 'lenis'
import 'lenis/dist/lenis.css'

// Passe à true quand l'écran de chargement s'efface : la scène joue alors son entrée.
export const loaded = ref(false)

export const reduceMotion =
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Défilement lissé (molette et pavé tactile) ; le tactile garde le défilement natif du téléphone.
export const lenis = reduceMotion
  ? null
  : new Lenis({ lerp: 0.085, wheelMultiplier: 0.9, anchors: true, autoRaf: true })

export function scrollToY(y) {
  if (lenis) lenis.scrollTo(y, { duration: 1.6 })
  else window.scrollTo({ top: y })
}
