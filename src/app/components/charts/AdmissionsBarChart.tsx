import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AdmissionsBarChartProps {
  data: Array<{ day: string; admissions: number }>;
}

export const AdmissionsBarChart = React.memo(({ data }: AdmissionsBarChartProps) => {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="day" stroke="#6b7280" />
        <YAxis stroke="#6b7280" />
        <Tooltip contentStyle={{ borderRadius: '8px' }} />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <Bar 
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