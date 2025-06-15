import { EnhancedExpenseManagement } from "@/components/expenses/enhanced-expense-management"

export default function ExpensesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Xarajatlar boshqaruvi</h1>
          <p className="text-muted-foreground">
            Kengaytirilgan xarajatlar boshqaruvi, tasdiqlash jarayoni va integratsiya
          </p>
        </div>
        <EnhancedExpenseManagement />
      </div>
    </div>
  )
}
