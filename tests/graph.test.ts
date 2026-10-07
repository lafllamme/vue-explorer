import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolve } from 'node:path'
import { allowedGraphSource, buildGraph } from '../module/graph'

const root = resolve(import.meta.dirname, '..')
test('component graph resolves member calls and backend services without unrelated exports', async () => {
  const registry = new Map<string, string>()
  const graph = await buildGraph(resolve(root, 'app/components/DownloadPayslipButton.vue'), root, resolve(root, 'app'), registry, new Map())
  assert.ok(graph.nodes.some(node => node.label === 'payrollApi.download'))
  assert.ok(graph.nodes.some(node => node.url === '/api/payslip-download'))
  assert.ok(graph.nodes.some(node => node.label === 'renderPayslip'))
  assert.ok(!graph.nodes.some(node => node.url === '/api/employee'))
  assert.ok(registry.has('server/services/payroll.ts'))
  assert.equal(new Set(graph.nodes.map(node => node.id)).size, graph.nodes.length)
  assert.ok(graph.edges.every(edge => graph.nodes.some(node => node.id === edge.source) && graph.nodes.some(node => node.id === edge.target)))
})
test('employee graph contains parallel request paths; presentation component has none', async () => {
  const graph = await buildGraph(resolve(root, 'app/components/EmployeeDetailPage.vue'), root, resolve(root, 'app'), new Map(), new Map())
  assert.ok(graph.nodes.some(node => node.url === '/api/employee'))
  assert.ok(graph.nodes.some(node => node.url === '/api/payslips'))
  assert.ok(graph.nodes.some(node => node.url === '/api/demo-failure'))
  assert.ok(graph.nodes.some(node => node.url === '/api/payslip-download'))
  assert.ok(graph.edges.some(edge => edge.label === 'renders'))
  const summary = await buildGraph(resolve(root, 'app/components/SalarySummary.vue'), root, resolve(root, 'app'), new Map(), new Map())
  assert.equal(summary.nodes.filter(node => node.kind === 'request').length, 0)
})
test('outside-root source is not read or registered', async () => {
  const registry = new Map<string, string>()
  const graph = await buildGraph(resolve(root, 'package.json'), root, resolve(root, 'app'), registry, new Map())
  assert.equal(graph.nodes.length, 0)
  assert.equal(registry.size, 0)
})
test('source guard excludes credentials, dependency directories and unsupported files', () => {
  const app = resolve(root, 'app'), server = resolve(root, 'server')
  assert.equal(allowedGraphSource(resolve(app, '.env'), app, server), false)
  assert.equal(allowedGraphSource(resolve(app, 'node_modules/pkg/index.ts'), app, server), false)
  assert.equal(allowedGraphSource(resolve(server, 'private.pem'), app, server), false)
  assert.equal(allowedGraphSource(resolve(server, 'services/payroll.ts'), app, server), true)
})
