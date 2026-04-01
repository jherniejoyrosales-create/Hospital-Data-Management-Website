import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface DiagnosisBarChartProps {
  data: Array<{ code: string; count: number }>;
}

export const DiagnosisBarChart = React.memo(({ data }: DiagnosisBarChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="code" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip contentStyle={{ borderRadius: '8px' }} />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <Bar 
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