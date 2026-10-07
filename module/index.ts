import { defineNuxtModule, addPlugin, createResolver, addTemplate, addVitePlugin } from '@nuxt/kit'
import { readFile, readdir } from 'node:fs/promises'
import { relative, resolve } from 'node:path'
import { createGenerator, presetWind3 } from 'unocss'
import { theme, shortcuts } from '../app/assets/unocss'
import { instrument, withinRoot } from './instrument'
import { initDevframe, type DevframeInstance } from 'devframe/initiate'
import { getTempAuthCodeInfo } from 'devframe/node/auth'
import { createExplorerDevframe } from './devframe'
import { apiRoute } from './routes'

export default defineNuxtModule({
  meta: { name: 'vue-explorer', configKey: 'vueExplorer' },
  async setup(_options, nuxt) {
    if (!nuxt.options.dev) return
    const resolver = createResolver(import.meta.url)
    const apiDirectory = resolve(nuxt.options.rootDir, 'server/api')
    const apiFiles = await readdir(apiDirectory, { recursive: true }).catch(() => [] as string[])
    const routes = apiFiles.map(file => apiRoute(`server/api/${file}`)).filter(Boolean)
    const routeTemplate = addTemplate({ filename: 'vue-explorer-routes.ts', write: true, getContents: () => `export default ${JSON.stringify(routes)}` })
    nuxt.hook('nitro:config', config => {
      config.plugins ||= []
      config.plugins.push(resolver.resolve('./runtime/server-trace'))
      config.alias ||= {}
      config.alias['#vue-explorer-routes'] = routeTemplate.dst
    })
    const files = new Map<string, string>()
    const autoImports = new Map<string, string>()
    nuxt.hook('imports:extend', imports => {
      for (const entry of imports) {
        if (entry.from.startsWith('/') && withinRoot(nuxt.options.srcDir, entry.from)) autoImports.set(entry.as || entry.name, entry.from)
      }
    })
    let instance: DevframeInstance | undefined
    const component = resolver.resolve('./runtime/Inspector.vue')
    const uno = await createGenerator({ presets: [presetWind3({ preflight: false })], theme, shortcuts })
    const { css } = await uno.generate((await Promise.all([component, resolver.resolve('./runtime/FlowGraph.vue'), resolver.resolve('./runtime/CodeViewer.vue')].map(file => readFile(file, 'utf8')))).join('\n'))
    const tokens = await readFile(resolver.resolve('../app/assets/css/tokens.css'), 'utf8')
    const reset = await readFile(resolver.resolve('./runtime/reset.css'), 'utf8')
    const flowBase = await readFile(resolver.resolve('../node_modules/@vue-flow/core/dist/style.css'), 'utf8')
    const flowStyles = await readFile(resolver.resolve('./runtime/flow.css'), 'utf8')
    addTemplate({ filename: 'vue-explorer-style.ts', getContents: () => `export default ${JSON.stringify(tokens + reset + flowBase + css + flowStyles)}` })
    addPlugin({ src: resolver.resolve('./runtime/plugin.client'), mode: 'client' })
    nuxt.options.vite.resolve ||= {}
    nuxt.options.vite.resolve.dedupe = [...new Set([...(nuxt.options.vite.resolve.dedupe || []), 'vue'])]
    addVitePlugin({
        name: 'vue-explorer-source', enforce: 'pre',
        transform(code, id) {
          if (!id.endsWith('.vue') || !withinRoot(nuxt.options.srcDir, id) || id.includes('/node_modules/')) return
          const name = relative(nuxt.options.rootDir, id)
          files.set(name, id)
          return instrument(code, name)
        },
        async configureServer(server) {
          await instance?.close()
          instance = initDevframe(createExplorerDevframe(nuxt.options.rootDir, files, nuxt.options.srcDir, autoImports), {
            base: '/__vue_explorer/', ws: false, mcp: false,
            getStorageDir: () => resolver.resolve('../node_modules/.cache/vue-explorer'),
          })
          await instance.ready
          const current = instance
          server.middlewares.use((req, res, next) => {
            if (!req.url?.startsWith(current.base)) return next()
            const host = req.headers.host || ''
            try {
              const hostname = new URL(`http://${host}`).hostname
              if (!['127.0.0.1', 'localhost', '[::1]'].includes(hostname)
                || req.headers['sec-fetch-site'] === 'cross-site'
                || (req.headers.origin && new URL(req.headers.origin).host !== host)) {
                res.statusCode = 403; res.end(); return
              }
            }
            catch { res.statusCode = 403; res.end(); return }
            if (req.url === `${current.base}__auth`) {
              if (req.method !== 'GET' || req.headers['sec-fetch-site'] !== 'same-origin') { res.statusCode = 403; res.end(); return }
              res.setHeader('Cache-Control', 'no-store')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ code: getTempAuthCodeInfo().code })); return
            }
            current.nodeMiddleware(req, res, next)
          })
          server.httpServer?.once('close', () => { void current.close() })
        },
    }, { client: true, server: false })
    addVitePlugin({
      name: 'vue-explorer-ssr-source', enforce: 'pre',
      transform(code, id) {
        if (!id.endsWith('.vue') || !withinRoot(nuxt.options.srcDir, id) || id.includes('/node_modules/')) return
        const name = relative(nuxt.options.rootDir, id)
        files.set(name, id)
        return instrument(code, name)
      },
    }, { client: false, server: true })
    nuxt.hook('close', async () => { await instance?.close(); instance = undefined })
  },
})
