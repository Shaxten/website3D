import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// base './' : les chemins sont relatifs, le site fonctionne donc sur GitHub Pages
// quel que soit le nom du dépôt (https://utilisateur.github.io/nom-du-depot/).
export default defineConfig({
  base: './',
  plugins: [vue()],
  build: { target: 'es2020' },
})
