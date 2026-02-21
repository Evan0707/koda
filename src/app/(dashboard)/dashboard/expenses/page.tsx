import { getExpenses, getExpenseCategories, getExpenseSummary } from '@/lib/actions/expenses'
import ExpensesClient from './expenses-client'

export default async function ExpensesPage() {
 const [expensesRes, categoriesRes, summaryRes] = await Promise.all([
  getExpenses(),
  getExpenseCategories(),
  getExpenseSummary(),
 ])

 return (
  <ExpensesClient
   initialExpenses={'error' in expensesRes ? [] : expensesRes.expenses || []}
   categories={'error' in categoriesRes ? [] : categoriesRes.categories || []}
   summary={'error' in summaryRes ? { totalAmount: 0, totalVat: 0, count: 0, pendingCount: 0, approvedCount: 0 } : summaryRes.summary!}
  />
 )
}
