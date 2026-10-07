<script setup lang="ts">
defineProps<{ label: string; value: string; change: string; points: number[] }>()
</script>
<template>
  <article class="ve-panel p-5 min-w-0">
    <div class="flex justify-between items-center gap-2"><h3 class="m-0 text-xs font-normal text-appMuted">{{ label }}</h3><span class="text-appMuted text-xs">↗</span></div>
    <p class="text-[26px] tracking-tight font-semibold mt-3 mb-1">{{ value }}</p>
    <p class="text-[10px] text-appMuted"><span class="text-appInk">{{ change }}</span> vs previous period</p>
    <svg class="w-full h-10 mt-5" viewBox="0 0 240 40" preserveAspectRatio="none" role="img" :aria-label="`${label} trend`"><polyline :points="points.map((value, index) => `${index * 240 / (points.length - 1)},${40 - value}`).join(' ')" fill="none" stroke="var(--ve-muted)" stroke-width="1.5" vector-effect="non-scaling-stroke" /></svg>
  </article>
</template>
