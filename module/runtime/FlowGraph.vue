<script setup lang="ts">
import { nextTick, onBeforeUnmount, shallowRef, watch } from 'vue'
import { VueFlow, Handle, Position, useVueFlow, type Node, type Edge } from '@vue-flow/core'
import ELK from 'elkjs/lib/elk.bundled.js'
import type { ComponentGraph, GraphNode } from '../graph'
import type { RequestTrace } from '../protocol'

const props = defineProps<{ graph: ComponentGraph; traces: RequestTrace[]; selected: string }>()
const emit = defineEmits<{ select: [node: GraphNode] }>()
const mode = shallowRef(window.matchMedia('(max-width: 640px)').matches ? 'List' : 'Graph')
const nodes = shallowRef<Node[]>([])
const edges = shallowRef<Edge[]>([])
const elk = new ELK()
const { fitView, zoomIn, zoomOut, onNodesInitialized } = useVueFlow()
onNodesInitialized(() => { void fitView({ padding: 0.12, duration: 0 }) })
let revision = 0
watch(() => props.graph, async graph => {
  const id = ++revision
  const result = await elk.layout({ id: 'root', layoutOptions: { 'elk.algorithm': 'layered', 'elk.direction': 'RIGHT', 'elk.spacing.nodeNode': '28', 'elk.layered.spacing.nodeNodeBetweenLayers': '64' }, children: graph.nodes.map(node => ({ id: node.id, width: 225, height: 92 })), edges: graph.edges.map(edge => ({ id: edge.id, sources: [edge.source], targets: [edge.target] })) })
  if (revision !== id) return
  edges.value = []
  nodes.value = graph.nodes.map(node => { const layout = result.children?.find(item => item.id === node.id); return { id: node.id, type: 'explorer', position: { x: layout?.x || 0, y: layout?.y || 0 }, data: node } })
  await nextTick()
  if (revision === id) edges.value = graph.edges.map(edge => ({ ...edge, type: 'smoothstep', animated: false, style: { stroke: '#777', strokeDasharray: '4 4' } }))
}, { immediate: true })
// Bundled ELK uses its in-process worker shim; it has no terminate() implementation.
onBeforeUnmount(() => { revision++ })
function match(node: GraphNode) { return node.url ? props.traces.find(trace => trace.path === node.url?.split('?')[0] && node.label.startsWith(`${trace.method} `)) : undefined }
</script>

<template>
  <section class="ve-flow-section">
    <div class="flex items-center justify-between gap-3 px-5 py-3 border-b border-appLine">
      <div><h3 class="ve-label">Data flow</h3><p class="ve-code mt-1">{{ graph.nodes.length }} nodes · static paths / URL-match hints</p></div>
      <div class="flex gap-1"><button v-for="item in ['Graph', 'List']" :key="item" class="ve-button" :aria-pressed="mode === item" @click="mode = item">{{ item }}</button><template v-if="mode === 'Graph'"><button class="ve-button" aria-label="Zoom out" @click="zoomOut()">−</button><button class="ve-button" aria-label="Zoom in" @click="zoomIn()">+</button><button class="ve-button" @click="fitView({ duration: 0 })">Fit</button></template></div>
    </div>
    <div v-if="mode === 'Graph'" class="ve-graph-canvas">
      <VueFlow v-if="nodes.length" :nodes="nodes" :edges="edges" :nodes-draggable="false" :nodes-connectable="false" :delete-key-code="null" :min-zoom="0.2" :max-zoom="2" @node-click="emit('select', $event.node.data)">
        <template #node-explorer="{ data }">
          <Handle type="target" :position="Position.Left" />
          <button class="ve-graph-node" :class="{ 've-node-selected': selected === data.id }" @keydown.enter.stop="emit('select', data)" @keydown.space.prevent.stop="emit('select', data)">
            <span class="ve-label">{{ data.kind }}</span><strong>{{ data.label }}</strong><span class="ve-code">{{ data.file.split('/').pop() }}:{{ data.line }}</span>
            <span v-if="data.url" class="ve-code">{{ match(data) ? `${match(data)?.status} · ${match(data)?.duration.toFixed(1)}ms · URL hint` : 'Not observed in browser' }}</span>
          </button>
          <Handle type="source" :position="Position.Right" />
        </template>
      </VueFlow>
    </div>
    <div v-else class="ve-graph-list ve-scroll"><button v-for="node in graph.nodes" :key="node.id" class="ve-graph-row" :class="{ 've-node-selected': selected === node.id }" @click="emit('select', node)"><span class="ve-label">{{ node.kind }}</span><strong>{{ node.label }}</strong><span class="ve-code">{{ node.file }}:{{ node.line }}</span><span class="ve-code">{{ graph.edges.filter(edge => edge.source === node.id).map(edge => `${edge.label} → ${graph.nodes.find(target => target.id === edge.target)?.label}`).join(' · ') }}</span></button></div>
    <p v-if="graph.diagnostics.length" role="status" class="ve-code px-5 py-2 border-t border-appLine">{{ graph.diagnostics.join(' · ') }}</p>
  </section>
</template>
