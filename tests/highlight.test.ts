import { test } from 'node:test'
import assert from 'node:assert/strict'
import { codeLanguage, getCodeHighlighter, highlightCode } from '../module/runtime/highlight'

test('Shiki preserves Vue/TS/JS source while adding syntax colors and shares one instance', async () => {
  assert.equal(codeLanguage('Example.vue'), 'vue')
  assert.equal(codeLanguage('service.ts'), 'typescript')
  assert.equal(codeLanguage('service.js'), 'javascript')
  const instance = await getCodeHighlighter()
  try {
    assert.equal(instance, await getCodeHighlighter())
    for (const [file, code] of [
      ['service.ts', 'export const greeting: string = "hello"\n'],
      ['service.js', 'const text = "<script>alert(1)</script>"'],
      ['Example.vue', '<script setup lang="ts">\nconst count = 1\n</script>\n<template><p>{{ count }}</p></template>'],
    ]) {
      const rows = await highlightCode(code!, file!)
      assert.equal(rows.map(row => row.map(token => token.content).join('')).join('\n'), code)
      assert.ok(new Set(rows.flat().map(token => token.color)).size > 1)
    }
  } finally { instance.dispose() }
})
