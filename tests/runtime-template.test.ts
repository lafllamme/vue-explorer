import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { parse, compileTemplate } from 'vue/compiler-sfc'

test('dev-only inspector templates compile after source formatting', () => {
  for (const name of ['Inspector', 'FlowGraph', 'CodeViewer']) {
    const filename = new URL(`../module/runtime/${name}.vue`, import.meta.url)
    const source = readFileSync(filename, 'utf8')
    const { descriptor, errors } = parse(source)
    assert.deepEqual(errors, [], `${name}: SFC parse`)
    assert.ok(descriptor.template)
    const result = compileTemplate({ source: descriptor.template.content, filename: filename.pathname, id: name })
    assert.deepEqual(result.errors, [], `${name}: template expressions`)
  }
})
