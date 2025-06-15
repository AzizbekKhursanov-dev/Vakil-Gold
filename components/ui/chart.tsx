"use client"

import type * as React from "react"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  type TooltipProps,
} from "recharts"
import { cn } from "@/lib/utils"

interface ChartConfig {
  [key: string]: {
    label: string
    color: string
  }
}

interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig
}

export function ChartContainer({ children, config, className, ...props }: ChartContainerProps) {
  return (
    <div
      className={cn("h-80 w-full", className)}
      style={
        {
          "--color-revenue": config.revenue?.color,
          "--color-expenses": config.expenses?.color,
          "--color-profit": config.profit?.color,
          "--color-total": config.total?.color,
          "--color-value": config.value?.color,
        } as React.CSSProperties
      }
      {...props}
    >
      {children}
    </div>
  )
}

interface ChartTooltipContentProps extends TooltipProps<any, any> {}

export function ChartTooltipContent({ active, payload, label, formatter, labelFormatter }: ChartTooltipContentProps) {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-background p-2 shadow-sm">
        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col">
            <span className="text-[0.70rem] uppercase text-muted-foreground">
              {labelFormatter ? labelFormatter(label) : label}
            </span>
            <span className="font-bold text-muted-foreground">
              {formatter ? formatter(payload[0].value) : payload[0].value.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    )
  }

  return null
}

export const ChartTooltip = Tooltip

interface ChartProps {
  data: any[]
  type: "area" | "bar" | "line" | "pie"
  xKey?: string
  yKey?: string
  dataKey?: string
  nameKey?: string
  valueKey?: string
  colors?: string[]
  height?: number
  width?: number
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  children?: React.ReactNode
}

export function Chart({
  data,
  type,
  xKey = "name",
  yKey = "value",
  dataKey = "value",
  nameKey = "name",
  valueKey = "value",
  colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"],
  height = 300,
  width = 500,
  showGrid = true,
  showLegend = true,
  showTooltip = true,
  children,
}: ChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] w-full border rounded-md bg-muted/20">
        <p className="text-muted-foreground">Ma'lumot mavjud emas</p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      {type === "area" ? (
        <AreaChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} />
          <YAxis />
          {showTooltip && <Tooltip content={<ChartTooltipContent />} />}
          {showLegend && <Legend />}
          <Area type="monotone" dataKey={dataKey} stroke={colors[0]} fill={colors[0]} />
          {children}
        </AreaChart>
      ) : type === "bar" ? (
        <BarChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} />
          <YAxis />
          {showTooltip && <Tooltip content={<ChartTooltipContent />} />}
          {showLegend && <Legend />}
          {children || <Bar dataKey={dataKey} fill={colors[0]} />}
        </BarChart>
      ) : type === "line" ? (
        <LineChart data={data}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xKey} />
          <YAxis />
          {showTooltip && <Tooltip content={<ChartTooltipContent />} />}
          {showLegend && <Legend />}
          <Line type="monotone" dataKey={dataKey} stroke={colors[0]} />
          {children}
        </LineChart>
      ) : (
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey={valueKey}
            nameKey={nameKey}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          {showTooltip && <Tooltip content={<ChartTooltipContent />} />}
          {showLegend && <Legend />}
          {children}
        </PieChart>
      )}
    </ResponsiveContainer>
  )
}

Chart.Bar = Bar
Chart.Line = Line
Chart.Area = Area
Chart.Pie = Pie
