"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GeneralSettings } from "@/components/settings/general-settings"
import { SystemSettings } from "@/components/settings/system-settings"
import { NotificationSettings } from "@/components/settings/notification-settings"
import { SecuritySettings } from "@/components/settings/security-settings"
import { UserManagement } from "@/components/settings/user-management"
import { DataManagement } from "@/components/settings/data-management"
import { IntegrationSettings } from "@/components/settings/integration-settings"
import { AppearanceSettings } from "@/components/settings/appearance-settings"
import { BusinessSettings } from "@/components/settings/business-settings"
import { AuditLogs } from "@/components/settings/audit-logs"

export function Settings() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5 lg:grid-cols-10">
          <TabsTrigger value="general">Umumiy</TabsTrigger>
          <TabsTrigger value="business">Biznes</TabsTrigger>
          <TabsTrigger value="appearance">Ko'rinish</TabsTrigger>
          <TabsTrigger value="users">Foydalanuvchilar</TabsTrigger>
          <TabsTrigger value="security">Xavfsizlik</TabsTrigger>
          <TabsTrigger value="notifications">Bildirishnomalar</TabsTrigger>
          <TabsTrigger value="data">Ma'lumotlar</TabsTrigger>
          <TabsTrigger value="integrations">Integratsiyalar</TabsTrigger>
          <TabsTrigger value="system">Tizim</TabsTrigger>
          <TabsTrigger value="audit">Audit</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="business">
          <BusinessSettings />
        </TabsContent>

        <TabsContent value="appearance">
          <AppearanceSettings />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="security">
          <SecuritySettings />
        </TabsContent>

        <TabsContent value="notifications">
          <NotificationSettings />
        </TabsContent>

        <TabsContent value="data">
          <DataManagement />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationSettings />
        </TabsContent>

        <TabsContent value="system">
          <SystemSettings />
        </TabsContent>

        <TabsContent value="audit">
          <AuditLogs />
        </TabsContent>
      </Tabs>
    </div>
  )
}
