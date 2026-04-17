'use client';

import { useState, useEffect } from 'react';
import { Plus, Target, Trash2 } from 'lucide-react';
import type { Goal, TaskCategory } from '@/types';

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('professional');
  const [targetValue, setTargetValue] = useState('');
  const [unit, setUnit] = useState('tasks');

  useEffect(() => { fetchGoals(); }, []);

  async function fetchGoals() {
    const res = await fetch('/api/goals');
    setGoals(await res.json());
  }

  async function addGoal(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !targetValue) return;
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: title.trim(), category, target_value: parseFloat(targetValue), unit }),
    });
    setTitle('');
    setTargetValue('');
    fetchGoals();
  }

  async function updateProgress(id: number, current: number, delta: number) {
    await fetch(`/api/goals/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ current_value: Math.max(0, current + delta) }),
    });
    fetchGoals();
  }

  async function deleteGoal(id: number) {
    await fetch(`/api/goals/${id}`, { method: 'DELETE' });
    fetchGoals();
  }

  return (
    <div className="space-y-6">
      <h2 className="font-display text-2xl font-bold text-text-primary">Goals</h2>

      {/* Add Goal */}
      <form onSubmit={addGoal} className="bg-surface-card border border-surface-border rounded-xl p-5 space-y-4">
        <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">New Goal</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="sm:col-span-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Goal title..."
              className="w-full bg-surface-primary border border-surface-border rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted font-body focus:outline-none focus:border-brand-purple/50"
              required
            />
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={targetValue}
              onChange={(e) => setTargetValue(e.target.value)}
              placeholder="Target"
              className="w-full bg-surface-primary border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-body focus:outline-none focus:border-brand-purple/50"
              required
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="unit"
              className="w-24 bg-surface-primary border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-body focus:outline-none"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as TaskCategory)}
              className="flex-1 bg-surface-primary border border-surface-border rounded-lg px-3 py-2.5 text-sm text-text-primary font-body focus:outline-none"
            >
              <option value="professional">Pro</option>
              <option value="personal">Personal</option>
            </select>
            <button type="submit" className="px-4 py-2.5 bg-brand-purple hover:bg-brand-magenta text-white rounded-lg text-sm font-medium transition-colors">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </form>

      {/* Goals Grid */}
      {goals.length === 0 ? (
        <div className="bg-surface-card border border-surface-border rounded-xl p-10 text-center">
          <Target size={40} className="text-text-muted mx-auto mb-3" />
          <p className="text-text-muted font-body">No goals yet. Set one above to start tracking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goals.map((goal) => {
            const pct = Math.min(100, Math.round((goal.current_value / goal.target_value) * 100));
            return (
              <div key={goal.id} className="bg-surface-card border border-surface-border rounded-xl p-5 group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-body text-sm font-medium text-text-primary">{goal.title}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${
                      goal.category === 'professional' ? 'bg-brand-purple/15 text-brand-purple' : 'bg-brand-cyan/15 text-brand-cyan'
                    }`}>{goal.category}</span>
                  </div>
                  <button onClick={() => deleteGoal(goal.id)} className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-brand-red transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="flex items-end gap-2 mb-2">
                  <span className="font-display text-2xl font-bold text-text-primary">{goal.current_value}</span>
                  <span className="text-text-muted text-sm font-body mb-1">/ {goal.target_value} {goal.unit}</span>
                </div>
                <div className="h-2 bg-surface-primary rounded-full overflow-hidden mb-3">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      pct >= 100 ? 'bg-brand-green' :
                      goal.category === 'professional' ? 'bg-brand-purple' : 'bg-brand-cyan'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono text-text-muted">{pct}%</span>
                  <div className="flex gap-1">
                    <button
                      onClick={() => updateProgress(goal.id, goal.current_value, -1)}
                      className="px-2 py-1 text-xs bg-surface-primary rounded hover:bg-surface-border text-text-muted transition-colors"
                    >-1</button>
                    <button
                      onClick={() => updateProgress(goal.id, goal.current_value, 1)}
                      className="px-2 py-1 text-xs bg-brand-purple/20 rounded hover:bg-brand-purple/30 text-brand-purple transition-colors"
                    >+1</button>
                    <button
                      onClick={() => updateProgress(goal.id, goal.current_value, 5)}
                      className="px-2 py-1 text-xs bg-brand-purple/20 rounded hover:bg-brand-purple/30 text-brand-purple transition-colors"
                    >+5</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
