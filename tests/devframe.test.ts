import { test } from 'node:test'
import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { resolve } from 'node:path'
import { initDevframe } from 'devframe/initiate'
import { createExplorerDevframe } from '../module/devframe'

test('Devframe serves allowlisted source, follows Nuxt composables and bounds request history', async () => {
  const root = fileURLToPath(new URL('..', import.meta.url))
  const file = 'app/components/Dashboard.vue'
  const instance = initDevframe(createExplorerDevframe(root, new Map([[file, resolve(root, file)]]), resolve(root, 'app'),
    new Map([['useMetrics', resolve(root, 'app/composables/useMetrics.ts')]])), {
    base: '/__vue_explorer/', ws: false, mcp: false, getStorageDir: () => resolve(root, 'node_modules/.cache/vue-explorer-tests'),
  })
  try {
    await instance.ready
    const ctx = await instance.context
    const source = await ctx.rpc.invokeLocal('vue-explorer:read-source', file)
    assert.equal(source.requests[0]?.url, '/api/metrics')
    assert.equal(source.requests[0]?.file, 'app/composables/useMetrics.ts')
    assert.equal(source.dependencies[0]?.name, 'useMetrics')
    await assert.rejects(ctx.rpc.invokeLocal('vue-explorer:read-source', '../../.env'))
    const graph = await ctx.rpc.invokeLocal('vue-explorer:analyze', file)
    assert.equal(graph.schemaVersion, 1)
    assert.ok(graph.nodes.some(node => node.url === '/api/metrics'))
    const composable = await ctx.rpc.invokeLocal('vue-explorer:read-source', 'app/composables/useMetrics.ts')
    assert.ok(composable.code.includes('useFetch'))
    await assert.rejects(ctx.rpc.invokeLocal('vue-explorer:read-source', 'server/.env'))
    for (let index = 0; index < 105; index++) await ctx.rpc.invokeLocal('vue-explorer:record-request', {
      id: String(index), path: '/api/metrics', method: 'GET', status: 200, duration: 10, timestamp: index,
    })
    const state = await ctx.scope('vue-explorer').rpc.sharedState('state')
    assert.equal(state.value().requests.length, 100)
    assert.equal(state.value().requests[0]?.id, '104')
    await ctx.rpc.invokeLocal('vue-explorer:clear-requests')
    assert.equal(state.value().requests.length, 0)
    const discovery = await instance.handler(new Request('http://127.0.0.1/__vue_explorer/__connection.json'))
    assert.equal(discovery.status, 200)
    assert.equal((await discovery.json()).backend, 'sse')
  }
  finally { await instance.close() }
})
