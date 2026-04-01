import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueChartProps {
  data: Array<{ month: string; revenue: number }>;
  formatPeso: (amount: number) => string;
}

export const RevenueChart = React.memo(({ data, formatPeso }: RevenueChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="month" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip formatter={(value) => formatPeso(Number(value))} contentStyle={{ borderRadius: '8px' }} />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <Line 
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