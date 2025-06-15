"use client"

import type React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Minus, DollarSign, Users, Package, Zap } from "lucide-react"

interface ProfitFactor {
  name: string
  impact: number // -100 to 100
  value: string
  change: number
  description: string
  icon: React.ReactNode
}

export function ProfitFactors() {
  const profitFactors: ProfitFactor[] = [
    {
      name: "Gold Price Volatility",
      impact: 45,
      value: "₹780,000/g",
      change: 12.5,
      description: "Current gold price affecting material costs",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      name: "Labor Cost Efficiency",
      impact: 25,
      value: "₹70,000/g",
      change: -3.2,
      description: "Labor cost per gram of jewelry",
      icon: <Users className="h-4 w-4" />,
    },
    {
      name: "Inventory Turnover",
      impact: 30,
      value: "2.4x/month",
      change: 8.1,
      description: "How quickly inventory converts to sales",
      icon: <Package className="h-4 w-4" />,
    },
    {
      name: "Lom Narxi Kirim Margin",
      impact: 35,
      value: "₹50,000/g",
      change: 5.7,
      description: "Transfer pricing margin to branches",
      icon: <Zap className="h-4 w-4" />,
    },
    {
      name: "Branch Performance",
      impact: 20,
      value: "85% avg",
      change: 2.3,
      description: "Average branch sales performance",
      icon: <TrendingUp className="h-4 w-4" />,
    },
    {
      name: "Supplier Relations",
      impact: 15,
      value: "92% rating",
      change: -1.1,
      description: "Supplier relationship quality score",
      icon: <Users className="h-4 w-4" />,
    },
  ]

  const getImpactColor = (impact: number) => {
    if (impact >= 30) return "text-green-600"
    if (impact >= 15) return "text-yellow-600"
    return "text-red-600"
  }

  const getChangeIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />
    return <Minus className="h-3 w-3 text-gray-600" />
  }

  const getChangeBadge = (change: number) => {
    const variant = change > 0 ? "default" : change < 0 ? "destructive" : "secondary"
    return (
      <Badge variant={variant} className="text-xs">
        {change > 0 ? "+" : ""}
        {change.toFixed(1)}%
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {profitFactors.map((factor) => (
          <Card key={factor.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {factor.icon}
                {factor.name}
              </CardTitle>
              {getChangeIcon(factor.change)}
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-bold">{factor.value}</div>
                  {getChangeBadge(factor.change)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Impact on Profit</span>
                    <span className={`font-medium ${getImpactColor(factor.impact)}`}>{factor.impact}%</span>
                  </div>
                  <Progress value={Math.abs(factor.impact)} className="h-2" />
                </div>

                <p className="text-xs text-muted-foreground">{factor.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profit Impact Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Positive Factors</span>
                <Badge variant="default">4 factors</Badge>
              </div>
              <div className="space-y-2">
                {profitFactors
                  .filter((f) => f.change > 0)
                  .map((factor) => (
                    <div key={factor.name} className="flex items-center justify-between text-sm">
                      <span>{factor.name}</span>
                      <span className="text-green-600">+{factor.change.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <span className="text-sm font-medium">Negative Factors</span>
                <Badge variant="destructive">2 factors</Badge>
              </div>
              <div className="space-y-2">
                {profitFactors
                  .filter((f) => f.change < 0)
                  .map((factor) => (
                    <div key={factor.name} className="flex items-center justify-between text-sm">
                      <span>{factor.name}</span>
                      <span className="text-red-600">{factor.change.toFixed(1)}%</span>
                    </div>
                  ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Optimization Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Optimize Gold Purchasing</p>
                    <p className="text-xs text-muted-foreground">
                      Monitor gold price trends and time purchases during dips
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Improve Labor Efficiency</p>
                    <p className="text-xs text-muted-foreground">
                      Implement training programs to reduce labor cost per gram
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Enhance Branch Performance</p>
                    <p className="text-xs text-muted-foreground">
                      Focus on underperforming branches with targeted support
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-purple-500 rounded-full mt-2"></div>
                  <div>
                    <p className="text-sm font-medium">Adjust Lom Narxi Kirim</p>
                    <p className="text-xs text-muted-foreground">
                      Review transfer pricing to optimize central vs branch profits
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
