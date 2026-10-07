<script setup lang="ts">
defineProps<{ total: number; count: number }>()
</script>
<template><section class="ve-panel p-5"><p class="ve-label">Total compensation</p><p class="text-3xl font-semibold tracking-tight mt-5">€{{ total.toLocaleString('en-US') }}</p><p class="text-xs text-appMuted mt-3">{{ count }} payslips · props from EmployeeDetailPage</p><p class="ve-code text-[10px] mt-6">Presentation only. No request here.</p></section></template>
