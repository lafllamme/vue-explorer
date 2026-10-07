<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, shallowRef, watch } from 'vue'
import type { ThemedToken } from 'shiki/core'
import { CODE_THEME, codeLanguage, highlightCode } from './highlight'

const props = defineProps<{ code: string; file: string; line: number }>()
const tokens = shallowRef<ThemedToken[][] | null>(null)
const notice = shallowRef('')
const container = shallowRef<HTMLElement>()
const plain = computed(() => props.code.split('\n').map(line => [{ content: line, color: undefined }]))
const rendered = computed(() => tokens.value || plain.value)
let revision = 0
async function scrollToLine() {
  await nextTick()
  const host = container.value
  const active = host?.querySelector<HTMLElement>('[data-active-line]')
  if (host && active) host.scrollTop = Math.max(0, active.offsetTop - host.clientHeight / 2)
}
watch(() => [props.code, props.file], async () => {
  const id = ++revision
  tokens.value = null; notice.value = ''
  // Preserve readable original code rather than blocking selection on a costly tokenizer run.
  if (props.code.length > 200_000) { notice.value = 'Large file: plain text preview.'; await scrollToLine(); return }
  try {
    const result = await highlightCode(props.code, props.file)
    if (id === revision) tokens.value = result
  } catch { if (id === revision) notice.value = 'Syntax highlighting unavailable; showing original text.' }
  if (id === revision) await scrollToLine()
}, { immediate: true })
watch(() => props.line, scrollToLine)
onBeforeUnmount(() => { revision++ })
</script>

<template>
  <section aria-label="Source code" class="ve-code-viewer">
    <div class="flex justify-between px-5 py-2 border-b border-appLine ve-code text-[10px]"><span>{{ codeLanguage(file) }}</span><span>Shiki · {{ CODE_THEME }}</span></div>
    <p v-if="notice" role="status" class="ve-code px-5 py-2">{{ notice }}</p>
    <pre ref="container" class="ve-flow-code ve-scroll font-mono text-[11px] leading-5 py-3"><code><span v-for="(row, index) in rendered" :key="index" class="ve-source-line px-5" :class="index + 1 === line ? 've-source-active' : ''" :data-active-line="index + 1 === line ? true : undefined"><span class="ve-line-number">{{ index + 1 }}</span><span v-for="(token, tokenIndex) in row" :key="tokenIndex" :style="{ color: token.color }">{{ token.content }}</span><span v-if="!row.length || row.every(token => !token.content)"> </span></span></code></pre>
  </section>
</template>
