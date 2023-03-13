import renderer from 'vite-plugin-electron-renderer'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  ssr: false,
  router: {
    options: {
      hashMode: true,
    },
  },
  modules: [
    'nuxt-electron',
  ],
  vite: {
    build: {
      target: 'chrome110',
    },
  },
  electron: {
    renderer: {
      nodeIntegration: true,
      optimizeDeps: {
        include: ['fs-extra', 'upath'],
      },
    }
  },
  typescript: { shim: false, typeCheck: true },
})
