import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TrendsChartProps {
  monthlyData: Array<{ period: string; count: number }>;
  weeklyData: Array<{ period: string; count: number }>;
}

export function TrendsChart({ monthlyData, weeklyData }: TrendsChartProps) {
  const [viewType, setViewType] = useState<'monthly' | 'weekly'>('monthly');
  const trendData = viewType === 'monthly' ? monthlyData : weeklyData;

  if (!trendData || trendData.length === 0) {
    return (
      <div className="h-[250px] md:h-[300px] flex items-center justify-center text-muted-foreground">
        No trend data available
      </div>
    );
  }

  const chartConfig = {
    count: {
      label: "Students",
      color: "hsl(var(--chart-1))",
    },
  };

  return (
    <div className="space-y-2 sm:space-y-4">
      <div className="flex justify-end">
        <Tabs value={viewType} onValueChange={(v) => setViewType(v as 'monthly' | 'weekly')}>
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-2">
            <TabsTrigger value="monthly" className="text-xs sm:text-sm px-2 sm:px-3">Monthly</TabsTrigger>
            <TabsTrigger value="weekly" className="text-xs sm:text-sm px-2 sm:px-3">Weekly</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <ChartContainer config={chartConfig} className="h-[200px] sm:h-[250px] md:h-[300px]">
        <AreaChart data={trendData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="period"
            angle={-45}
            textAnchor="end"
            height={50}
            tick={{ fontSize: 8 }}
            className="sm:text-[9px] md:text-xs"
          />
          <YAxis tick={{ fontSize: 8 }} className="sm:text-[9px] md:text-xs" />
          <ChartTooltip content={<ChartTooltipContent />} />
          <Area
            type="monotone"
            dataKey="count"
            stroke="var(--color-count)"
            fill="var(--color-count)"
            fillOpacity={0.2}
            strokeWidth={2}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}
