import { renderPayslip } from '../services/payroll'
export default defineEventHandler((event) => {
  setHeader(event, 'Content-Type', 'text/plain; charset=utf-8')
  setHeader(event, 'Content-Disposition', 'attachment; filename="demo-payslip.txt"')
  return renderPayslip()
})
