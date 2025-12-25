import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from "@/components/ui/chart";
import { useEffect, useState } from 'react';

interface CourseChartProps {
  data: Array<{ course: string; count: number }>;
}

const COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
  'hsl(210, 85%, 55%)',
  'hsl(210, 85%, 65%)',
  'hsl(210, 85%, 35%)',
  'hsl(210, 70%, 45%)',
  'hsl(210, 70%, 55%)',
  'hsl(210, 60%, 45%)',
];

export function CourseChart({ data }: CourseChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!data || data.length === 0) {
    return (
      <div className="h-[300px] md:h-[400px] flex items-center justify-center text-muted-foreground">
        No course data available
      </div>
    );
  }

  const chartConfig = {
    count: {
      label: "Students",
    },
  };

  // Calculate total for percentage
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Mobile view: Simple list
  if (isMobile) {
    return (
      <div className="space-y-3 py-2">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between border-b pb-2 last:border-b-0">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm font-medium">{item.course}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-semibold">{item.count}</div>
              <div className="text-xs text-muted-foreground">
                {((item.count / total) * 100).toFixed(0)}%
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop view: Pie chart
  return (
    <ChartContainer config={chartConfig} className="h-[300px] md:h-[400px]">
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="course"
          cx="50%"
          cy="50%"
          outerRadius={80}
          label={({ course, count, percent }) =>
            `${course}: ${count} (${(percent * 100).toFixed(0)}%)`
          }
          labelLine={{ stroke: 'hsl(var(--border))', strokeWidth: 1 }}
          className="md:text-sm text-xs"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} className="flex-wrap text-xs" />
      </PieChart>
    </ChartContainer>
  );
}
