<script setup lang="ts">
import DownloadPayslipButton from './DownloadPayslipButton.vue'
defineProps<{ payslips: { id: string; month: string; amount: number }[] }>()
</script>
<template>
  <section class="ve-panel overflow-hidden">
    <div class="px-5 py-4 border-b border-appLine">
      <h3 class="text-xs font-medium">Payslips</h3>
    </div>
    <div
      v-for="item in payslips"
      :key="item.id"
      class="flex flex-wrap gap-3 justify-between items-center px-5 py-4 border-b border-appLine"
    >
      <div>
        <p class="text-xs">{{ item.month }}</p>
        <p class="ve-code text-[10px] mt-1">€{{ item.amount.toLocaleString('en-US') }}</p>
      </div>
      <DownloadPayslipButton />
    </div>
    <p v-if="!payslips.length" class="p-5 text-xs text-appMuted">No payslips loaded yet.</p>
  </section>
</template>
