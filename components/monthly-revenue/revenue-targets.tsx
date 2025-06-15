"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Edit, Save, X, Target, TrendingUp } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { formatCurrency } from "@/lib/utils/currency"

interface RevenueTargetsProps {
  year: number
  month: number
}

// Mock data - in real app this would come from Firebase
const initialTargets = [
  {
    id: "central",
    name: "Markaz",
    monthlyTarget: 50000000,
    currentRevenue: 45000000,
    yearlyTarget: 600000000,
    yearlyRevenue: 540000000,
    lastUpdated: "2024-01-15",
  },
  {
    id: "bulungur",
    name: "Bulung'ur",
    monthlyTarget: 35000000,
    currentRevenue: 32000000,
    yearlyTarget: 420000000,
    yearlyRevenue: 384000000,
    lastUpdated: "2024-01-15",
  },
  {
    id: "qiziltepa",
    name: "Qizil Tepa",
    monthlyTarget: 30000000,
    currentRevenue: 28000000,
    yearlyTarget: 360000000,
    yearlyRevenue: 336000000,
    lastUpdated: "2024-01-15",
  },
  {
    id: "tashkent",
    name: "Toshkent",
    monthlyTarget: 40000000,
    currentRevenue: 35000000,
    yearlyTarget: 480000000,
    yearlyRevenue: 420000000,
    lastUpdated: "2024-01-15",
  },
]

export function RevenueTargets({ year, month }: RevenueTargetsProps) {
  const { toast } = useToast()
  const [targets, setTargets] = useState(initialTargets)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<{ monthlyTarget: number; yearlyTarget: number }>({
    monthlyTarget: 0,
    yearlyTarget: 0,
  })

  const handleEdit = (target: any) => {
    setEditingId(target.id)
    setEditValues({
      monthlyTarget: target.monthlyTarget,
      yearlyTarget: target.yearlyTarget,
    })
  }

  const handleSave = () => {
    if (!editingId) return

    setTargets((prev) =>
      prev.map((target) =>
        target.id === editingId
          ? {
              ...target,
              monthlyTarget: editValues.monthlyTarget,
              yearlyTarget: editValues.yearlyTarget,
              lastUpdated: new Date().toISOString().split("T")[0],
            }
          : target,
      ),
    )

    toast({
      title: "Maqsad yangilandi",
      description: "Yangi maqsadlar muvaffaqiyatli saqlandi",
    })

    setEditingId(null)
  }

  const handleCancel = () => {
    setEditingId(null)
    setEditValues({ monthlyTarget: 0, yearlyTarget: 0 })
  }

  const getAchievementStatus = (current: number, target: number) => {
    const percentage = (current / target) * 100
    if (percentage >= 95) return { status: "excellent", color: "bg-green-500" }
    if (percentage >= 85) return { status: "good", color: "bg-blue-500" }
    if (percentage >= 75) return { status: "warning", color: "bg-yellow-500" }
    return { status: "poor", color: "bg-red-500" }
  }

  const totalMonthlyTarget = targets.reduce((sum, target) => sum + target.monthlyTarget, 0)
  const totalCurrentRevenue = targets.reduce((sum, target) => sum + target.currentRevenue, 0)
  const totalYearlyTarget = targets.reduce((sum, target) => sum + target.yearlyTarget, 0)
  const totalYearlyRevenue = targets.reduce((sum, target) => sum + target.yearlyRevenue, 0)

  return (
    <div className="space-y-6">
      {/* Overall Targets Summary */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Oylik maqsad</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalMonthlyTarget)}</div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Bajarilish</span>
                <span>{((totalCurrentRevenue / totalMonthlyTarget) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(totalCurrentRevenue / totalMonthlyTarget) * 100} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Joriy: {formatCurrency(totalCurrentRevenue)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Yillik maqsad</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalYearlyTarget)}</div>
            <div className="mt-2">
              <div className="flex justify-between text-sm mb-1">
                <span>Bajarilish</span>
                <span>{((totalYearlyRevenue / totalYearlyTarget) * 100).toFixed(1)}%</span>
              </div>
              <Progress value={(totalYearlyRevenue / totalYearlyTarget) * 100} className="h-2" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">Joriy: {formatCurrency(totalYearlyRevenue)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Branch Targets */}
      <Card>
        <CardHeader>
          <CardTitle>Filiallar bo'yicha maqsadlar</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {targets.map((target) => {
              const monthlyAchievement = getAchievementStatus(target.currentRevenue, target.monthlyTarget)
              const yearlyAchievement = getAchievementStatus(target.yearlyRevenue, target.yearlyTarget)
              const isEditing = editingId === target.id

              return (
                <div key={target.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-medium text-lg">{target.name}</h3>
                      <p className="text-sm text-muted-foreground">Oxirgi yangilanish: {target.lastUpdated}</p>
                    </div>
                    <div className="flex space-x-2">
                      {!isEditing ? (
                        <Button variant="outline" size="sm" onClick={() => handleEdit(target)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      ) : (
                        <>
                          <Button variant="outline" size="sm" onClick={handleSave}>
                            <Save className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleCancel}>
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Monthly Target */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Oylik maqsad</Label>
                        <Badge variant={monthlyAchievement.status === "excellent" ? "default" : "secondary"}>
                          {((target.currentRevenue / target.monthlyTarget) * 100).toFixed(1)}%
                        </Badge>
                      </div>

                      {isEditing ? (
                        <Input
                          type="number"
                          value={editValues.monthlyTarget}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              monthlyTarget: Number(e.target.value),
                            }))
                          }
                        />
                      ) : (
                        <div className="text-lg font-medium">{formatCurrency(target.monthlyTarget)}</div>
                      )}

                      <Progress value={(target.currentRevenue / target.monthlyTarget) * 100} className="h-2" />
                      <p className="text-sm text-muted-foreground">Joriy: {formatCurrency(target.currentRevenue)}</p>
                    </div>

                    {/* Yearly Target */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <Label>Yillik maqsad</Label>
                        <Badge variant={yearlyAchievement.status === "excellent" ? "default" : "secondary"}>
                          {((target.yearlyRevenue / target.yearlyTarget) * 100).toFixed(1)}%
                        </Badge>
                      </div>

                      {isEditing ? (
                        <Input
                          type="number"
                          value={editValues.yearlyTarget}
                          onChange={(e) =>
                            setEditValues((prev) => ({
                              ...prev,
                              yearlyTarget: Number(e.target.value),
                            }))
                          }
                        />
                      ) : (
                        <div className="text-lg font-medium">{formatCurrency(target.yearlyTarget)}</div>
                      )}

                      <Progress value={(target.yearlyRevenue / target.yearlyTarget) * 100} className="h-2" />
                      <p className="text-sm text-muted-foreground">Joriy: {formatCurrency(target.yearlyRevenue)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Target Achievement Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Maqsad bajarilishi tahlili</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <h4 className="font-medium">Oylik maqsadlar</h4>
              {targets.map((target) => {
                const percentage = (target.currentRevenue / target.monthlyTarget) * 100
                const achievement = getAchievementStatus(target.currentRevenue, target.monthlyTarget)

                return (
                  <div key={`monthly-${target.id}`} className="flex items-center justify-between">
                    <span className="text-sm">{target.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${achievement.color}`}></div>
                      <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="space-y-3">
              <h4 className="font-medium">Yillik maqsadlar</h4>
              {targets.map((target) => {
                const percentage = (target.yearlyRevenue / target.yearlyTarget) * 100
                const achievement = getAchievementStatus(target.yearlyRevenue, target.yearlyTarget)

                return (
                  <div key={`yearly-${target.id}`} className="flex items-center justify-between">
                    <span className="text-sm">{target.name}</span>
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${achievement.color}`}></div>
                      <span className="text-sm font-medium">{percentage.toFixed(1)}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
