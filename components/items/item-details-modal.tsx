"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils/currency"
import { ITEM_STATUSES } from "@/lib/config/constants"
import type { Item } from "@/lib/types/item"

interface ItemDetailsModalProps {
  item: Item
}

export function ItemDetailsModal({ item }: ItemDetailsModalProps) {
  const statusConfig = ITEM_STATUSES.find((s) => s.id === item.status)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle>Asosiy ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Model:</span>
              <span className="font-medium">{item.model}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Kategoriya:</span>
              <span className="font-medium">{item.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Og'irligi:</span>
              <span className="font-medium">{item.weight}g</span>
            </div>
            {item.size && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">O'lchami:</span>
                <span className="font-medium">{item.size}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Miqdori:</span>
              <span className="font-medium">{item.quantity}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Holati:</span>
              <Badge variant={statusConfig?.color as any}>{statusConfig?.name}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Pricing Information */}
        <Card>
          <CardHeader>
            <CardTitle>Narx ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lom Narxi:</span>
              <span className="font-medium">{formatCurrency(item.lomNarxi)}/g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Lom Narxi Kirim:</span>
              <span className="font-medium">{formatCurrency(item.lomNarxiKirim)}/g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Mehnat haqi:</span>
              <span className="font-medium">{formatCurrency(item.laborCost)}/g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Foyda foizi:</span>
              <span className="font-medium">{item.profitPercentage}%</span>
            </div>
            <div className="flex justify-between text-lg">
              <span className="text-muted-foreground">Sotuv narxi:</span>
              <span className="font-bold text-primary">{formatCurrency(item.sellingPrice)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Branch Information */}
        <Card>
          <CardHeader>
            <CardTitle>Filial ma'lumotlari</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Turi:</span>
              <span className="font-medium">{item.isProvider ? "Markaz (Ta'minotchi)" : "Filial"}</span>
            </div>
            {!item.isProvider && item.branch && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Filial:</span>
                <span className="font-medium">{item.branch}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sotib olingan sana:</span>
              <span className="font-medium">{new Date(item.purchaseDate).toLocaleDateString("uz-UZ")}</span>
            </div>
            {item.distributedDate && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tarqatilgan sana:</span>
                <span className="font-medium">{new Date(item.distributedDate).toLocaleDateString("uz-UZ")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Additional Details */}
        <Card>
          <CardHeader>
            <CardTitle>Qo'shimcha ma'lumotlar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {item.color && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Rangi:</span>
                <span className="font-medium">{item.color}</span>
              </div>
            )}
            {item.purity && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tozaligi:</span>
                <span className="font-medium">{item.purity}</span>
              </div>
            )}
            {item.stoneType && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tosh turi:</span>
                <span className="font-medium">{item.stoneType}</span>
              </div>
            )}
            {item.stoneWeight && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tosh og'irligi:</span>
                <span className="font-medium">{item.stoneWeight} karat</span>
              </div>
            )}
            {item.manufacturer && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ishlab chiqaruvchi:</span>
                <span className="font-medium">{item.manufacturer}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Notes */}
      {item.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Izohlar</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{item.notes}</p>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle>Holat tarixi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Yaratilgan:</span>
            <span className="font-medium">{new Date(item.createdAt).toLocaleString("uz-UZ")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Oxirgi yangilanish:</span>
            <span className="font-medium">{new Date(item.updatedAt).toLocaleString("uz-UZ")}</span>
          </div>
          {item.soldDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sotilgan sana:</span>
              <span className="font-medium">{new Date(item.soldDate).toLocaleString("uz-UZ")}</span>
            </div>
          )}
          {item.returnedDate && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Qaytarilgan sana:</span>
              <span className="font-medium">{new Date(item.returnedDate).toLocaleString("uz-UZ")}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
