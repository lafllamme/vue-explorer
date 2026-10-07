import { defineNitroPlugin } from 'nitropack/runtime'
// @ts-ignore generated in development only
import routes from '#vue-explorer-routes'

export default defineNitroPlugin((nitro) => {
  nitro.hooks.hook('request', event => {
    if (event.path.startsWith('/api/')) event.context.vueExplorerStarted = performance.now()
  })
  nitro.hooks.hook('beforeResponse', event => {
    const started = event.context.vueExplorerStarted
    if (typeof started !== 'number' || event.node.res.headersSent) return
    const duration = performance.now() - started
    const matched = event.context.matchedRoute?.path
    const route = (routes as { path: string; method: string; file: string }[]).find(route =>
      (!route.method || route.method === event.method) && (route.path === matched || route.path === event.path.split('?')[0]))
    const existing = event.node.res.getHeader('Server-Timing')
    event.node.res.setHeader('Server-Timing', [existing, `vue-explorer;dur=${duration.toFixed(2)}`].filter(Boolean).join(', '))
    if (route) event.node.res.setHeader('X-Vue-Explorer-Handler', encodeURIComponent(route.file))
  })
})
