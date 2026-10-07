import { getEmployee } from '../services/payroll'
export default defineEventHandler(() => getEmployee())
