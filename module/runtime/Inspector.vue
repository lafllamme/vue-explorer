<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useInspector } from './useInspector'
import { useExplorerConnection } from './connection'
import type { SourceInfo } from '../protocol'
import FlowGraph from './FlowGraph.vue'
import CodeViewer from './CodeViewer.vue'
import type { ComponentGraph, GraphNode } from '../graph'

const { picking, opened, selected, box, chain, sourceFile, sourceLine, label, start, close } = useInspector()
const tab = ref('Data flow')
const tabs = ['Overview', 'Source', 'Data flow', 'Styles']
const connection = useExplorerConnection()
const connectionStatus = connection.status
const shared = connection.state
const source = ref<SourceInfo | null>(null)
const loading = ref(false)
const error = ref('')
const notice = ref('')
const active = ref(0)
const closeButton = ref<HTMLButtonElement>()
const graph = ref<ComponentGraph | null>(null)
const nodeSource = ref<SourceInfo | null>(null)
const selectedNode = ref<GraphNode | null>(null)
const nodeError = ref('')
let nodeRevision = 0
async function selectNode(node: GraphNode) {
  const revision = ++nodeRevision
  selectedNode.value = node; nodeSource.value = null; nodeError.value = ''
  try {
    const result = await connection.client?.call('vue-explorer:read-source', node.file)
    if (revision === nodeRevision) nodeSource.value = result || null
  } catch (reason) { if (revision === nodeRevision) nodeError.value = String(reason) }
}
const current = computed(() => chain.value[active.value])
const file = computed(() => source.value?.file || sourceFile.value)
const styleRows = computed(() => {
  if (!selected.value) return []
  const style = getComputedStyle(selected.value)
  return ['display', 'position', 'width', 'height', 'padding', 'gap', 'color', 'background-color', 'font-family', 'font-size', 'border-radius'].map(key => [key, style.getPropertyValue(key)])
})
let requestId = 0
watch([sourceFile, connectionStatus], async ([value]) => {
  const id = ++requestId
  source.value = null; error.value = ''; notice.value = ''
  graph.value = null; nodeSource.value = null; selectedNode.value = null; nodeRevision++
  if (!value) { loading.value = false; return }
  loading.value = true
  try {
    if (!connection.client) throw new Error('Devframe is connecting. Source will load when connected.')
    const result = await connection.client.call('vue-explorer:read-source', value)
    if (id === requestId) source.value = result
    const snapshot = await connection.client.call('vue-explorer:analyze', value)
    if (id === requestId) { graph.value = snapshot; const root = snapshot.nodes.find(node => node.id === snapshot.root); if (root) await selectNode(root) }
  }
  catch (reason) { if (id === requestId) error.value = reason instanceof Error ? reason.message : 'Unable to read source.' }
  finally { if (id === requestId) loading.value = false }
})
watch(selected, async () => { active.value = 0; tab.value = 'Data flow'; await nextTick(); closeButton.value?.focus() })
watch([sourceFile, sourceLine], () => connection.select({ file: sourceFile.value, line: sourceLine.value, component: current.value?.name || '' }))
const matchingRequests = computed(() => shared.value.requests.filter(trace => graph.value?.nodes.some(node => node.url?.split('?')[0] === trace.path)))
async function copy() {
  try { await navigator.clipboard.writeText(`${file.value}:${sourceLine.value}`); notice.value = 'Source location copied' }
  catch { notice.value = 'Clipboard unavailable. Copy the source location above.' }
}
function openEditor() {
  // Vite's existing editor endpoint accepts only instrumented source paths here.
  fetch(`/__open-in-editor?file=${encodeURIComponent(`${source.value?.editorFile || file.value}:${sourceLine.value}:1`)}`)
    .then(response => { notice.value = response.ok ? 'Editor request sent' : 'Set your Vite editor configuration to open files.' })
    .catch(() => { notice.value = 'Editor could not be reached.' })
}
function openNodeEditor() {
  if (!nodeSource.value || !selectedNode.value) return
  fetch(`/__open-in-editor?file=${encodeURIComponent(`${nodeSource.value.editorFile}:${selectedNode.value.line}:1`)}`).catch(() => { notice.value = 'Editor could not be reached.' })
}
function selectComponent(index: number) {
  active.value = index
  const path = chain.value[index]?.file
  if (!path) return
  sourceFile.value = path
  sourceLine.value = 1
}
</script>

<template>
  <div v-if="box" aria-hidden="true" class="fixed z-[2147483646] pointer-events-none border border-white bg-white/5 rounded-sm" :style="{ left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px` }">
    <span class="absolute left-0 top-0 -translate-y-full rounded-t bg-white text-black font-mono text-[10px] px-2 py-1">{{ label }} · {{ Math.round(box.width) }} × {{ Math.round(box.height) }}</span>
  </div>
  <button v-if="!opened" class="ve-button fixed bottom-5 left-1/2 -translate-x-1/2 z-[2147483647] bg-appSurface shadow-xl px-4 py-3" :aria-pressed="picking" @click="start">
    <span aria-hidden="true">⌖</span><span>{{ picking ? 'Select an element' : 'Inspect element' }}</span>
    <kbd class="font-mono text-[10px] text-appMuted border border-appLine rounded px-1.5 py-0.5">{{ picking ? 'esc' : '⌥ click' }}</kbd>
  </button>
  <aside v-if="opened" aria-label="Vue Explorer inspector" class="ve-drawer ve-scroll fixed right-0 top-0 z-[2147483647] bg-appBg text-appInk border-l border-appLine flex flex-col shadow-2xl">
    <header class="flex items-center justify-between border-b border-appLine p-4">
      <div class="flex items-center gap-2"><span class="font-semibold text-base tracking-tight">◈</span><span class="font-semibold text-sm">Vue Explorer</span><span class="ve-code border border-appLine rounded px-1.5 py-0.5 text-[9px]">DEV</span></div>
      <div class="flex gap-1"><button class="ve-button border-0" :aria-pressed="picking" aria-label="Pick another element" @click="start">⌖</button><button ref="closeButton" class="ve-button border-0" aria-label="Close inspector" @click="close">✕</button></div>
    </header>
    <div class="ve-selected-header p-4 py-3 flex flex-wrap items-center gap-4">
      <div class="min-w-0"><h2 class="text-lg font-semibold tracking-tight">{{ current?.name || selected?.tagName.toLowerCase() }}</h2>
      <p class="ve-code mt-2 truncate" :title="`${file}:${sourceLine}`">{{ file || 'No local source location' }}<span v-if="file" class="text-appInk">:{{ sourceLine }}</span></p></div>
      <div class="flex gap-2 ml-auto"><button class="ve-button" :disabled="!file" @click="openEditor">↗ Open in editor</button><button class="ve-button border-0 text-appMuted" :disabled="!file" @click="copy">Copy path</button></div>
      <p v-if="notice" role="status" class="text-xs text-appMuted mt-3">{{ notice }}</p>
    </div>
    <nav aria-label="Component ancestry" class="flex gap-2 px-5 pb-3 overflow-x-auto"><button v-for="(entry, index) in chain" :key="index" class="ve-button shrink-0" :aria-pressed="active === index" @click="selectComponent(index)">{{ entry.name }}</button></nav>
    <nav aria-label="Inspector sections" class="flex border-b border-appLine px-4 gap-4">
      <button v-for="item in tabs" :key="item" class="bg-transparent border-0 border-b-2 px-0 py-3 text-xs cursor-pointer focus-visible:outline-2 focus-visible:outline-appInk" :class="tab === item ? 'text-appInk border-white' : 'text-appMuted border-transparent hover:text-appInk'" :aria-current="tab === item ? 'page' : undefined" @click="tab = item">{{ item }}</button>
    </nav>
    <div class="flex-1 overflow-auto ve-scroll">
      <div v-if="tab === 'Overview'" class="p-5">
        <div class="flex justify-between mb-4"><h3 class="ve-label">Component ancestry</h3><span class="ve-code">{{ chain.length }} components</span></div>
        <div class="ve-panel overflow-hidden">
          <button v-for="(entry, index) in chain" :key="index" class="flex items-center gap-3 text-left w-full border-0 border-b border-appLine px-4 py-3 cursor-pointer focus-visible:outline-2 focus-visible:outline-appInk" :class="active === index ? 'bg-appRaised text-appInk' : 'bg-transparent text-appMuted hover:bg-appRaised'" @click="selectComponent(index)">
            <span class="font-mono text-xs text-appMuted">{{ index === 0 ? '◇' : '↳' }}</span><span class="text-xs truncate">{{ entry.name }}</span><span v-if="index === 0" class="ml-auto font-mono text-[9px] text-appMuted">OWNER</span>
          </button>
          <p v-if="!chain.length" class="text-appMuted text-xs p-4">No Vue component instance found for this element.</p>
        </div>
        <h3 class="ve-label mt-7 mb-4">{{ current?.name || 'Element' }} props</h3>
        <div v-if="current && Object.keys(current.props).length" class="ve-panel p-4 space-y-3">
          <div v-for="(value, key) in current.props" :key="key" class="flex justify-between gap-5 ve-code"><span class="text-appInk">{{ key }}</span><span class="break-all text-right">{{ value }}</span></div>
        </div>
        <p v-else class="text-xs text-appMuted leading-relaxed border border-dashed border-appLine rounded-lg p-4">This component has no public props.</p>
        <h3 class="ve-label mt-7 mb-4">Rendered element</h3>
        <div class="ve-panel p-4 space-y-3 ve-code"><div class="flex justify-between"><span>Tag</span><span class="text-appInk">&lt;{{ selected?.tagName.toLowerCase() }}&gt;</span></div><div class="flex justify-between gap-5"><span>Classes</span><span class="text-right break-all text-appInk">{{ selected?.getAttribute('class') || 'None' }}</span></div></div>
      </div>
      <div v-else-if="tab === 'Source'" class="py-4">
        <p v-if="loading" role="status" class="text-appMuted px-5 text-xs">Reading source…</p>
        <p v-else-if="error || !source" role="status" class="text-appMuted px-5 text-xs">{{ error || 'No source available for this element.' }}</p>
        <CodeViewer v-else :code="source.code" :file="source.file" :line="sourceLine" />
      </div>
      <div v-else-if="tab === 'Data flow'">
        <FlowGraph v-if="graph" :graph="graph" :traces="shared.requests" :selected="selectedNode?.id || ''" @select="selectNode" />
        <p v-else role="status" class="text-appMuted text-xs p-5">{{ loading ? 'Analyzing component…' : error || 'No local graph available.' }}</p>
        <div v-if="selectedNode" class="ve-node-details px-5 py-3 border-b border-appLine flex justify-between items-center"><div><p class="ve-label">{{ selectedNode.kind }} · {{ selectedNode.label }}</p><p class="ve-code mt-2">{{ selectedNode.file }}:{{ selectedNode.line }}</p></div><button class="ve-button" :disabled="!nodeSource" @click="openNodeEditor">↗ Open in editor</button></div>
        <p v-if="nodeError" role="status" class="ve-code p-5">{{ nodeError }}</p>
        <CodeViewer v-else-if="nodeSource" :code="nodeSource.code" :file="nodeSource.file" :line="selectedNode?.line || 1" />
        <div class="p-5">
        <div class="flex justify-between mb-3"><h3 class="ve-label">Live requests</h3><button class="ve-button py-1" @click="connection.client?.call('vue-explorer:clear-requests').catch(() => { notice = 'Could not clear requests.' })">Clear</button></div>
        <p class="text-xs text-appMuted leading-relaxed mb-4">{{ matchingRequests.length }} captured requests match graph destinations. URL matching is a hint, not proof of component ownership. Close the inspector and reload the employee to capture more requests.</p>
        <div v-for="trace in matchingRequests" :key="trace.id" class="ve-panel p-3 mb-3 ve-code"><div class="flex justify-between"><span class="text-appInk">{{ trace.method }} {{ trace.path }}</span><span>{{ trace.status }} · {{ trace.duration.toFixed(1) }} ms</span></div><p v-if="trace.handler" class="mt-3 break-all">↳ {{ trace.handler }}</p><p v-if="trace.serverDuration != null" class="mt-2">Nitro processing · {{ trace.serverDuration.toFixed(2) }} ms</p></div>
        </div>
      </div>
      <div v-else class="p-5"><h3 class="ve-label mb-4">Computed styles</h3><div class="ve-panel px-4"><div v-for="row in styleRows" :key="row[0]" class="flex justify-between gap-5 border-b border-appLine py-3 ve-code"><span>{{ row[0] }}</span><span class="text-right break-all text-appInk">{{ row[1] }}</span></div></div></div>
    </div>
    <footer class="flex justify-between border-t border-appLine p-4 ve-code text-[10px]"><span>{{ picking ? 'Click an element to inspect' : `Devframe · ${connectionStatus}` }}</span><span>esc to close</span></footer>
  </aside>
</template>
