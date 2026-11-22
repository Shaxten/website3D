import { createApp } from 'vue'
import '@fontsource-variable/inter'
import '@fontsource-variable/space-grotesk'
import './style.css'
import App from './App.vue'

const app = createApp(App)

// v-reveal : fait apparaître l'élément quand il entre dans l'écran.
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (e.isIntersecting) {
        e.target.classList.add('in')
        io.unobserve(e.target)
      }
    }
  },
  { threshold: 0.15, rootMargin: '0px 0px -6% 0px' },
)
app.directive('reveal', {
  mounted(el, { value }) {
    el.classList.add('reveal')
    if (value?.delay) el.style.transitionDelay = `${value.delay}ms`
    io.observe(el)
  },
  unmounted(el) {
    io.unobserve(el)
  },
})

// v-tilt : inclinaison 3D de l'élément selon la position du pointeur.
app.directive('tilt', {
  mounted(el, { value }) {
    const max = value?.max ?? 8
    const move = (ev) => {
      const r = el.getBoundingClientRect()
      const x = (ev.clientX - r.left) / r.width - 0.5
      const y = (ev.clientY - r.top) / r.height - 0.5
      el.style.setProperty('--ry', `${(x * max * 2).toFixed(2)}deg`)
      el.style.setProperty('--rx', `${(-y * max * 2).toFixed(2)}deg`)
      el.style.setProperty('--mx', `${((x + 0.5) * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${((y + 0.5) * 100).toFixed(1)}%`)
    }
    const leave = () => {
      el.style.setProperty('--ry', '0deg')
      el.style.setProperty('--rx', '0deg')
    }
    el.classList.add('tilt')
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    el._tilt = { move, leave }
  },
  unmounted(el) {
    el.removeEventListener('pointermove', el._tilt.move)
    el.removeEventListener('pointerleave', el._tilt.leave)
  },
})

app.mount('#app')
