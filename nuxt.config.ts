export default defineNuxtConfig({
  compatibilityDate: '2026-10-08',
  devtools: { enabled: false },
  modules: ['@unocss/nuxt', './module/index'],
  css: ['~/assets/css/main.css'],
  app: { head: {
    title: 'Vue Explorer — see what’s behind your UI',
    htmlAttrs: { lang: 'en' },
    meta: [{ name: 'theme-color', content: '#090909' }],
    link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
  } },
})
