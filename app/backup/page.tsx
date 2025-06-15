import { AppLayout } from "@/components/layout/app-layout"
import { BackupSystem } from "@/components/backup/backup-system"

export default function BackupPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Zaxira nusxa</h1>
          <p className="text-muted-foreground">Ma'lumotlar bazasini zaxiralash va tiklash</p>
        </div>
        <BackupSystem />
      </div>
    </AppLayout>
  )
}
