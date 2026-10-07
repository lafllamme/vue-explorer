import { test } from 'node:test'
import assert from 'node:assert/strict'
import { instrument, withinRoot, possibleRequests } from '../module/instrument'
import { apiRoute } from '../module/routes'

test('maps Nitro route files, methods, dynamic segments and index routes', () => {
  assert.deepEqual(apiRoute('server/api/metrics.get.ts'), { path: '/api/metrics', method: 'GET', file: 'server/api/metrics.get.ts' })
  assert.equal(apiRoute('server/api/users/[id].patch.ts')?.path, '/api/users/:id')
  assert.equal(apiRoute('server/api/users/index.ts')?.path, '/api/users')
  assert.equal(apiRoute('server/api/[...all].ts')?.path, '/api/**')
  assert.equal(apiRoute('app/components/MetricCard.vue'), null)
})

test('tags native template elements with original lines and leaves component props alone', () => {
  const code = '<script setup>const x = 1</script>\n<template>\n  <div><MetricCard /><span>Value</span></div>\n</template>'
  const result = instrument(code, 'app/pages/index.vue')!
  assert.match(result.code, /<div data-ve-file="app\/pages\/index.vue" data-ve-line="3"/)
  assert.match(result.code, /<span data-ve-file=/)
  assert.match(result.code, /<MetricCard \/>/)
  assert.ok(result.map)
})
test('rejects sibling paths and accepts source descendants', () => {
  assert.equal(withinRoot('/projects/app', '/projects/app-extra/secret.vue'), false)
  assert.equal(withinRoot('/projects/app', '/projects/app/pages/index.vue'), true)
})
test('only reports literal request hints with source locations', () => {
  const calls = possibleRequests("<script setup>\nconst data = useFetch('/api/metrics')\n$fetch(`/api/${id}`)\nfetch(url)\n// fetch('/ignored')\n</script><template><code>fetch('/ignored')</code></template>")
  assert.deepEqual(calls, [{ name: 'useFetch', url: '/api/metrics', line: 2, kind: 'static' }])
})
