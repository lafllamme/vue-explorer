export const employeeApi = {
  getById() { return $fetch('/api/employee') },
}

export const payrollApi = {
  list() { return $fetch('/api/payslips') },
  download() { return $fetch<Blob>('/api/payslip-download', { responseType: 'blob' }) },
  simulateFailure() { return $fetch('/api/demo-failure') },
}
