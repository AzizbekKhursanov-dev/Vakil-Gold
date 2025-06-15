import { AppLayout } from "@/components/layout/app-layout"
import { AddItemWizard } from "@/components/items/add-item-wizard"

export default function AddItemPage() {
  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Add New Item</h1>
          <p className="text-muted-foreground">Add a new jewelry item to your inventory</p>
        </div>
        <AddItemWizard />
      </div>
    </AppLayout>
  )
}
