'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { WeeklyEffort } from '@/types';

interface Props {
  data: WeeklyEffort[];
}

export default function ProductivityChart({ data }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
        Weekly Effort Breakdown
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" vertical={false} />
            <XAxis dataKey="day" tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#8b949e', fontSize: 11 }} axisLine={false} tickLine={false} unit="h" />
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
            <Legend
              wrapperStyle={{ fontSize: '12px', fontFamily: 'Exo 2' }}
              iconType="circle"
              iconSize={8}
            />
            <Bar dataKey="professional" fill="#AF00F1" radius={[4, 4, 0, 0]} name="Professional" />
            <Bar dataKey="personal" fill="#00e5ff" radius={[4, 4, 0, 0]} name="Personal" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
