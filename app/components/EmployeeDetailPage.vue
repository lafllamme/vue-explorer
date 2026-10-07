<script setup lang="ts">
import { employeeApi, payrollApi } from '../services/employeeApi'
import SalarySummary from './SalarySummary.vue'
import PayslipList from './PayslipList.vue'
const employee = shallowRef<Awaited<ReturnType<typeof employeeApi.getById>>>()
const payslips = shallowRef<Awaited<ReturnType<typeof payrollApi.list>>>([])
const pending = ref(false)
const message = ref('')
const total = computed(() => payslips.value.reduce((sum, item) => sum + item.amount, 0))
async function refreshEmployee() {
  pending.value = true; message.value = ''
  try { [employee.value, payslips.value] = await Promise.all([employeeApi.getById(), payrollApi.list()]) }
  catch { message.value = 'Unable to load employee. Try again.' }
  finally { pending.value = false }
}
async function simulateFailure() {
  try { await payrollApi.simulateFailure() }
  catch { message.value = 'Expected demo error: API returned 503. Inspect the failure path.' }
}
onMounted(refreshEmployee)
</script>

<template>
  <section class="p-5 md:p-7 border-t border-appLine">
    <div class="flex flex-wrap justify-between gap-4 items-start"><div><p class="ve-label mb-3">Employee workspace · real API paths</p><h2 class="text-xl font-semibold tracking-tight">{{ employee?.name || 'Employee details' }}</h2><p class="text-xs text-appMuted mt-2">{{ employee?.role || 'Loading employee…' }} · In-memory demo data</p></div><div class="flex flex-wrap gap-2"><button class="ve-button" :disabled="pending" @click="refreshEmployee">{{ pending ? 'Loading…' : 'Reload employee' }}</button><button class="ve-button" @click="simulateFailure">Test failed request</button></div></div>
    <p v-if="message" role="status" class="text-xs text-appMuted mt-4">{{ message }}</p>
    <div class="grid md:grid-cols-[1fr_2fr] gap-4 mt-6"><SalarySummary :total="total" :count="payslips.length" /><PayslipList :payslips="payslips" /></div>
    <p class="ve-code text-[10px] mt-5">⌥ Select this heading for both API branches · Select Download for its unexecuted path · Use breadcrumbs to explore the parent</p>
  </section>
</template>
