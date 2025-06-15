import { AppLayout } from "@/components/layout/app-layout"
import { BulkImportForm } from "@/components/items/bulk-import-form"

export default function BulkImportPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Bulk Import Items</h1>
          <p className="text-muted-foreground">Import multiple jewelry items from an Excel file</p>
        </div>
        <BulkImportForm />
      </div>
    </AppLayout>
  )
}
