export function getEmployee() {
  return { id: 'demo-01', name: 'Alex Morgan', role: 'Design engineer' }
}
export function listPayslips() {
  return [{ id: '01', month: 'September 2026', amount: 4200 }, { id: '02', month: 'August 2026', amount: 4200 }]
}
export function renderPayslip() {
  return 'DEMO PAYSLIP\nAlex Morgan\nSeptember 2026\nEUR 4,200\nIn-memory fixture — not a financial document.\n'
}
