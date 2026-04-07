import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdmissionsBarChartProps {
  data: Array<{ day: string; admissions: number }>;
}

export const AdmissionsBarChart = React.memo(({ data }: AdmissionsBarChartProps) => {
  // Ensure each data point has a unique key
  const chartData = React.useMemo(() => 
    data.map((item, index) => ({
      ...item,
      key: `admission-${item.day}-${index}`,
      id: item.id || `admission-${item.day}-${index}`
    })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={300} key="admissions-chart-container">
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} key="admissions-bar-chart">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" key="admissions-grid" />
        <XAxis dataKey="day" stroke="#6b7280" key="admissions-xaxis" />
        <YAxis stroke="#6b7280" key="admissions-yaxis" />
        <Tooltip contentStyle={{ borderRadius: '8px' }} key="admissions-tooltip" />
        <Legend wrapperStyle={{ paddingTop: '10px' }} key="admissions-legend" />
        <Bar 
          key="admissions-bar"
          dataKey="admissions" 
          fill="#10b981" 
          name="Admissions"
          isAnimationActive={false}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

AdmissionsBarChart.displayName = 'AdmissionsBarChart';