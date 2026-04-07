import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>;
  formatPeso: (amount: number) => string;
}

export const RevenueChart = React.memo(({ data, formatPeso }: RevenueChartProps) => {
  // Ensure each data point has a unique key
  const chartData = React.useMemo(() => 
    data.map((item, index) => ({
      ...item,
      key: `revenue-${item.month}-${index}`,
      id: item.id || `revenue-${item.month}-${index}`
    })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={300} key="revenue-chart-container">
      <LineChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} key="revenue-line-chart">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" key="revenue-grid" />
        <XAxis dataKey="month" stroke="#6b7280" key="revenue-xaxis" />
        <YAxis stroke="#6b7280" key="revenue-yaxis" />
        <Tooltip formatter={(value) => formatPeso(Number(value))} contentStyle={{ borderRadius: '8px' }} key="revenue-tooltip" />
        <Legend wrapperStyle={{ paddingTop: '10px' }} key="revenue-legend" />
        <Line 
          key="revenue-line"
          type="monotone" 
          dataKey="revenue" 
          stroke="#1e3a8a" 
          strokeWidth={2} 
          name="Revenue"
          isAnimationActive={false}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
});

RevenueChart.displayName = 'RevenueChart';