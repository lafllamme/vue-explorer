<script setup lang="ts">
const { data, status, refresh } = await useMetrics()
const period = ref('Last 30 days')
const periods = ['Last 30 days', 'Last 7 days']
const metrics = computed(() =>
  period.value === 'Last 7 days' ? data.value?.weekly || [] : data.value?.monthly || [],
)
const activity = [
  { name: 'Design system', path: 'feat/tokens', time: '2 minutes ago', state: 'Ready' },
  { name: 'Dashboard', path: 'feat/overview', time: '18 minutes ago', state: 'Ready' },
  { name: 'Authentication', path: 'fix/session', time: '1 hour ago', state: 'Ready' },
]
</script>
<template>
  <section class="p-5 md:p-7 bg-appBg">
    <div class="flex flex-wrap items-center justify-between gap-4 mb-7">
      <div>
        <h2 class="m-0 text-lg tracking-tight font-semibold">Overview</h2>
        <p class="text-[11px] text-appMuted mt-2">
          A small dashboard. Real Vue components to explore.
        </p>
      </div>
      <div class="flex gap-2">
        <button class="ve-button" @click="period = periods[period === periods[0] ? 1 : 0]!">
          {{ period }}
          <span aria-hidden="true">⌄</span>
        </button>
        <button class="ve-button" :disabled="status === 'pending'" @click="refresh()">
          {{ status === 'pending' ? 'Loading…' : 'Refresh' }}
        </button>
      </div>
    </div>
    <div class="grid sm:grid-cols-3 gap-3">
      <MetricCard v-for="metric in metrics" :key="metric.label" v-bind="metric" />
    </div>
    <div class="ve-panel mt-6 overflow-hidden">
      <div class="px-5 py-4 border-b border-appLine flex justify-between">
        <h3 class="m-0 text-xs font-medium">Recent deployments</h3>
        <span class="ve-code text-[10px]">3 deployments</span>
      </div>
      <div
        v-for="entry in activity"
        :key="entry.name"
        class="flex items-center px-5 py-4 gap-4 border-b border-appLine last:border-b-0"
      >
        <span class="w-7 h-7 shrink-0 ve-panel flex items-center justify-center text-appMuted">
          ◇
        </span>
        <div class="flex-1 min-w-0">
          <p class="text-xs m-0">{{ entry.name }}</p>
          <p class="ve-code text-[10px] mt-1">{{ entry.path }}</p>
        </div>
        <span class="text-[10px] text-appMuted hidden sm:inline">{{ entry.time }}</span>
        <span
          class="text-[10px] border border-appLine rounded-full py-1 px-2.5 flex items-center gap-1.5"
        >
          <span class="w-1 h-1 bg-appInk rounded-full"></span>
          {{ entry.state }}
        </span>
      </div>
    </div>
    <div class="flex items-center gap-2 text-[10px] text-appMuted mt-5">
      <span>↳</span>
      <span>
        Powered by
        <code class="font-mono text-appInk">useFetch('/api/metrics')</code>
        · Try inspecting a metric card
      </span>
    </div>
  </section>
</template>
