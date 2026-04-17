'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { TrendData } from '@/types';

interface Props {
  data: TrendData[];
}

export default function TrendsChart({ data }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
        Productivity Trends
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
            <XAxis dataKey="week" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="left" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis yAxisId="right" orientation="right" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
            <Tooltip
              contentStyle={{
                background: '#161b22',
                border: '1px solid #30363d',
                borderRadius: '8px',
                fontFamily: 'Exo 2',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#e6edf3' }}
            />
            <Legend wrapperStyle={{ fontSize: '12px', fontFamily: 'Exo 2' }} iconType="circle" iconSize={8} />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="tasksCompleted"
              stroke="#4ade80"
              strokeWidth={2}
              dot={{ fill: '#4ade80', r: 3 }}
              name="Tasks Completed"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="hoursLogged"
              stroke="#fbbf24"
              strokeWidth={2}
              dot={{ fill: '#fbbf24', r: 3 }}
              name="Hours Logged"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
