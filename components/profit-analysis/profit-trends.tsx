"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Mock data - in real app this would come from Firebase
const monthlyProfitData = [
  { month: "Jan", profit: 8500000, margin: 24.5 },
  { month: "Feb", profit: 9200000, margin: 25.1 },
  { month: "Mar", profit: 8800000, margin: 24.8 },
  { month: "Apr", profit: 10500000, margin: 26.2 },
  { month: "May", profit: 11200000, margin: 26.8 },
  { month: "Jun", profit: 12000000, margin: 27.5 },
  { month: "Jul", profit: 11800000, margin: 27.2 },
  { month: "Aug", profit: 12500000, margin: 27.8 },
  { month: "Sep", profit: 13000000, margin: 28.3 },
  { month: "Oct", profit: 13500000, margin: 28.7 },
  { month: "Nov", profit: 14200000, margin: 29.2 },
  { month: "Dec", profit: 15000000, margin: 30.0 },
]

const quarterlyProfitData = [
  { quarter: "Q1 2023", profit: 26500000, margin: 24.8 },
  { quarter: "Q2 2023", profit: 33700000, margin: 26.8 },
  { quarter: "Q3 2023", profit: 37300000, margin: 27.8 },
  { quarter: "Q4 2023", profit: 42700000, margin: 29.3 },
  { quarter: "Q1 2024", profit: 45200000, margin: 30.1 },
]

const yearlyProfitData = [
  { year: "2020", profit: 95000000, margin: 22.5 },
  { year: "2021", profit: 110000000, margin: 23.8 },
  { year: "2022", profit: 125000000, margin: 24.5 },
  { year: "2023", profit: 140200000, margin: 27.2 },
]

export function ProfitTrends() {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="monthly" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="monthly">Oylik Trend</TabsTrigger>
          <TabsTrigger value="quarterly">Choraklik Trend</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Oylik Foyda Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyProfitData}>
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name) => [
                      name === "profit" ? `₹${(value / 1000000).toFixed(1)}M` : `${value}%`,
                      name === "profit" ? "Foyda" : "Margin",
                    ]}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} name="Foyda" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="margin"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Margin"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quarterly" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Choraklik Foyda Trendi</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={quarterlyProfitData}>
                  <XAxis dataKey="quarter" />
                  <YAxis yAxisId="left" orientation="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip
                    formatter={(value: number, name) => [
                      name === "profit" ? `₹${(value / 1000000).toFixed(1)}M` : `${value}%`,
                      name === "profit" ? "Foyda" : "Margin",
                    ]}
                  />
                  <Line yAxisId="left" type="monotone" dataKey="profit" stroke="#8884d8" strokeWidth={2} name="Foyda" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="margin"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    name="Margin"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
