import { defineDevframe, defineRpcFunction } from 'devframe'
import * as v from 'valibot'
import { readFile } from 'node:fs/promises'
import { relative } from 'node:path'
import type { ExplorerState } from './protocol'
import { analyzeDependencies } from './analysis'
import { allowedGraphSource, buildGraph } from './graph'
import { realpath } from 'node:fs/promises'
import { resolve } from 'node:path'

export function createExplorerDevframe(root: string, files: Map<string, string>, srcDir = root, autoImports = new Map<string, string>()) {
  return defineDevframe({
    id: 'vue-explorer', name: 'Vue Explorer', version: '0.2.0', packageName: 'vue-explorer',
    homepage: 'https://github.com/devframes/devframe', description: 'Vue and Nuxt source and request inspector',
    async setup(ctx) {
      const scope = ctx.scope('vue-explorer')
      const state = await scope.rpc.sharedState('state', { initialValue: { selection: null, requests: [] } as ExplorerState })
      const sources = new Map<string, string>()
      const findSource = async (name: string) => {
        const file = files.get(name) || sources.get(name) || [...files.values()].find(file => file === name)
        if (!file) throw new Error('Source unavailable. Select an instrumented Vue element.')
        const canonical = await realpath(file)
        if (!allowedGraphSource(canonical, srcDir, resolve(root, 'server'))) throw new Error('Source is outside allowed roots or has a forbidden type.')
        return canonical
      }
      scope.rpc.register(defineRpcFunction({
        name: 'analyze', type: 'query', args: [v.pipe(v.string(), v.maxLength(4096))] as const,
        returns: v.object({ schemaVersion: v.literal(1), root: v.string(),
          nodes: v.array(v.object({ id: v.string(), kind: v.string(), label: v.string(), file: v.string(), line: v.number(), url: v.optional(v.string()) })),
          edges: v.array(v.object({ id: v.string(), source: v.string(), target: v.string(), label: v.string() })), diagnostics: v.array(v.string()) }),
        async handler(name: string) { return buildGraph(await findSource(name), root, srcDir, sources, autoImports) },
      }))
      scope.rpc.register(defineRpcFunction({
        name: 'read-source', type: 'query', args: [v.pipe(v.string(), v.maxLength(4096))] as const, returns: v.object({
          file: v.string(), editorFile: v.string(), code: v.string(),
          requests: v.array(v.object({ name: v.string(), url: v.string(), line: v.number(), kind: v.literal('static'), file: v.string() })),
          dependencies: v.array(v.object({ from: v.string(), file: v.string(), name: v.string() })),
        }),
        async handler(name: string) {
          const file = await findSource(name)
          const code = await readFile(file, 'utf8')
          return { file: relative(root, file), editorFile: file, code, ...await analyzeDependencies(file, code, root, srcDir, autoImports) }
        },
      }))
      scope.rpc.register(defineRpcFunction({
        name: 'record-request', type: 'action', args: [v.object({
          id: v.pipe(v.string(), v.maxLength(80)), path: v.pipe(v.string(), v.maxLength(2048)),
          method: v.pipe(v.string(), v.maxLength(16)), status: v.pipe(v.number(), v.minValue(0), v.maxValue(599)),
          duration: v.pipe(v.number(), v.minValue(0)), timestamp: v.number(),
          handler: v.optional(v.pipe(v.string(), v.maxLength(4096))),
          serverDuration: v.optional(v.pipe(v.number(), v.minValue(0))),
        })] as const, returns: v.void(),
        handler(trace) { state.mutate(draft => { draft.requests.unshift(trace); draft.requests.length = Math.min(draft.requests.length, 100) }) },
      }))
      scope.rpc.register(defineRpcFunction({ name: 'clear-requests', type: 'action', handler() { state.mutate(draft => { draft.requests = [] }) } }))
    },
  })
}
