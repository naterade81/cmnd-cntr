'use client';

import { useState, useEffect } from 'react';
import { Users, Flame, CheckSquare, Clock, Target } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface MemberStats {
  user: { id: number; name: string; display_name: string; avatar_color: string };
  tasksCompletedThisWeek: number;
  hoursThisWeek: number;
  streak: number;
  activeGoals: number;
}

interface WeeklyEffort {
  days: string[];
  members: { name: string; color: string; hours: number[] }[];
}

interface Activity {
  type: string;
  userName: string;
  userColor: string;
  description: string;
  timestamp: string;
}

export default function FamilyPage() {
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [weeklyEffort, setWeeklyEffort] = useState<WeeklyEffort | null>(null);
  const [recentActivity, setRecentActivity] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/family')
      .then((r) => r.json())
      .then((data) => {
        setMemberStats(data.memberStats);
        setWeeklyEffort(data.weeklyEffort);
        setRecentActivity(data.recentActivity);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-text-muted font-body">Loading family data...</p>
      </div>
    );
  }

  // Build chart data from weekly effort
  const chartData = weeklyEffort ? weeklyEffort.days.map((day, i) => {
    const point: Record<string, string | number> = { day };
    for (const member of weeklyEffort.members) {
      point[member.name] = member.hours[i];
    }
    return point;
  }) : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users size={24} className="text-brand-purple" />
        <h2 className="font-display text-xl md:text-2xl font-bold text-text-primary">Family Dashboard</h2>
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {memberStats.map((m) => (
          <div key={m.user.id} className="bg-surface-card border border-surface-border rounded-xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold font-display"
                style={{ backgroundColor: m.user.avatar_color }}
              >
                {m.user.display_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-text-primary font-display font-semibold">{m.user.display_name}</p>
                <p className="text-text-muted text-xs font-mono">@{m.user.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare size={14} className="text-brand-green" />
                <div>
                  <p className="text-text-primary text-sm font-mono font-bold">{m.tasksCompletedThisWeek}</p>
                  <p className="text-text-muted text-[10px] font-body">tasks/week</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-brand-cyan" />
                <div>
                  <p className="text-text-primary text-sm font-mono font-bold">{m.hoursThisWeek.toFixed(1)}</p>
                  <p className="text-text-muted text-[10px] font-body">hours/week</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Flame size={14} className="text-brand-amber" />
                <div>
                  <p className="text-text-primary text-sm font-mono font-bold">{m.streak}</p>
                  <p className="text-text-muted text-[10px] font-body">day streak</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Target size={14} className="text-brand-purple" />
                <div>
                  <p className="text-text-primary text-sm font-mono font-bold">{m.activeGoals}</p>
                  <p className="text-text-muted text-[10px] font-body">goals</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Family Weekly Effort Chart */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Weekly Effort</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e1e2e', border: '1px solid #333', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend />
                {weeklyEffort?.members.map((member) => (
                  <Bar key={member.name} dataKey={member.name} fill={member.color} stackId="effort" radius={[2, 2, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-surface-card border border-surface-border rounded-xl p-5">
          <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">Recent Activity</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {recentActivity.length === 0 ? (
              <p className="text-text-muted text-sm font-body">No activity yet</p>
            ) : (
              recentActivity.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: a.userColor }}
                  >
                    {a.userName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-text-primary text-sm font-body truncate">{a.description}</p>
                    <p className="text-text-muted text-xs font-mono">
                      {a.userName} &middot; {new Date(a.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
