<script setup lang="ts">
import { payrollApi } from '../services/employeeApi'
const pending = ref(false)
const message = ref('')
async function downloadPayslip() {
  pending.value = true
  try {
    const blob = await payrollApi.download()
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url; link.download = 'demo-payslip.txt'; link.click()
    URL.revokeObjectURL(url)
    message.value = 'Downloaded'
  } catch { message.value = 'Download failed' }
  finally { pending.value = false }
}
</script>
<template><div><button class="ve-button" :disabled="pending" @click="downloadPayslip">{{ pending ? 'Downloading…' : 'Download payslip' }} ↗</button><span v-if="message" role="status" class="block ve-code text-[10px] mt-2">{{ message }}</span></div></template>
