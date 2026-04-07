import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DiagnosisBarChartProps {
  data: Array<{ code: string; count: number }>;
}

export const DiagnosisBarChart = React.memo(({ data }: DiagnosisBarChartProps) => {
  // Ensure each data point has a unique key
  const chartData = React.useMemo(() => 
    data.map((item, index) => ({
      ...item,
      key: `diagnosis-${item.code}-${index}`,
      id: item.id || `diagnosis-${item.code}-${index}`
    })),
    [data]
  );

  return (
    <ResponsiveContainer width="100%" height={300} key="diagnosis-chart-container">
      <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }} key="diagnosis-bar-chart">
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" key="diagnosis-grid" />
        <XAxis dataKey="code" stroke="#6b7280" key="diagnosis-xaxis" />
        <YAxis stroke="#6b7280" key="diagnosis-yaxis" />
        <Tooltip contentStyle={{ borderRadius: '8px' }} key="diagnosis-tooltip" />
        <Legend wrapperStyle={{ paddingTop: '10px' }} key="diagnosis-legend" />
        <Bar 
          key="diagnosis-bar"
          dataKey="count" 
          fill="#3b82f6" 
          name="Patients"
          isAnimationActive={false}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
});

DiagnosisBarChart.displayName = 'DiagnosisBarChart';