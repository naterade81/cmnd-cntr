'use client';

import { useState, useEffect } from 'react';
import { Plus, Trash2, CheckCircle2, Circle, Clock, Filter, Pencil, X, Save, ExternalLink } from 'lucide-react';
import type { Task, TaskCategory, TaskStatus, TaskPriority } from '@/types';

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filterCategory, setFilterCategory] = useState<TaskCategory | ''>('');
  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TaskCategory>('professional');
  const [newScheduledDate, setNewScheduledDate] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<{
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
    project: string;
    scheduled_date: string;
    due_date: string;
  }>({ title: '', category: 'professional', priority: 'medium', project: '', scheduled_date: '', due_date: '' });

  useEffect(() => {
    fetchTasks();
  }, [filterCategory, filterStatus]);

  async function fetchTasks() {
    const params = new URLSearchParams();
    if (filterCategory) params.set('category', filterCategory);
    if (filterStatus) params.set('status', filterStatus);
    const res = await fetch(`/api/tasks?${params}`);
    setTasks(await res.json());
  }

  async function addTask(e: React.FormEvent) {
    e.preventDefault();
    if (!newTitle.trim()) return;
    await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle.trim(), category: newCategory, scheduled_date: newScheduledDate || null }),
    });
    setNewTitle('');
    setNewScheduledDate('');
    fetchTasks();
  }

  async function toggleStatus(id: number, current: TaskStatus) {
    if (editingId === id) return;
    const next = current === 'completed' ? 'pending' : current === 'pending' ? 'in_progress' : 'completed';
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: next }),
    });
    fetchTasks();
  }

  async function deleteTask(id: number) {
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    fetchTasks();
  }

  function startEditing(task: Task) {
    setEditingId(task.id);
    setEditForm({
      title: task.title,
      category: task.category,
      priority: task.priority,
      project: task.project || '',
      scheduled_date: task.scheduled_date || '',
      due_date: task.due_date || '',
    });
  }

  function cancelEditing() {
    setEditingId(null);
  }

  async function saveEdit(id: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: editForm.title.trim(),
        category: editForm.category,
        priority: editForm.priority,
        project: editForm.project.trim() || null,
        scheduled_date: editForm.scheduled_date || null,
        due_date: editForm.due_date || null,
      }),
    });
    setEditingId(null);
    fetchTasks();
  }

  const statusIcon = (s: TaskStatus) => {
    if (s === 'completed') return <CheckCircle2 size={18} className="text-brand-green" />;
    if (s === 'in_progress') return <Clock size={18} className="text-brand-cyan" />;
    return <Circle size={18} className="text-text-muted" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-2xl font-bold text-text-primary">Tasks</h2>
      </div>

      {/* Quick Add */}
      <form onSubmit={addTask} className="flex flex-col sm:flex-row gap-3">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a new task..."
          className="flex-1 bg-surface-card border border-surface-border rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-brand-purple/50 font-body"
        />
        <div className="flex gap-3">
          <select
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value as TaskCategory)}
            className="flex-1 sm:flex-none bg-surface-card border border-surface-border rounded-lg px-3 py-3 text-sm text-text-primary font-body focus:outline-none focus:border-brand-purple/50"
          >
            <option value="professional">Professional</option>
            <option value="personal">Personal</option>
          </select>
          <input
            type="date"
            value={newScheduledDate}
            onChange={(e) => setNewScheduledDate(e.target.value)}
            title="Work on date"
            className="flex-1 sm:flex-none bg-surface-card border border-surface-border rounded-lg px-3 py-3 text-sm text-text-primary font-body focus:outline-none focus:border-brand-purple/50"
          />
          <button type="submit" className="flex items-center gap-2 px-5 py-3 bg-brand-purple hover:bg-brand-magenta text-white rounded-lg text-sm font-medium transition-colors font-body whitespace-nowrap">
            <Plus size={16} /> Add
          </button>
        </div>
      </form>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter size={16} className="text-text-muted" />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value as TaskCategory | '')}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary font-body focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="professional">Professional</option>
          <option value="personal">Personal</option>
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}
          className="bg-surface-card border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary font-body focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Task List */}
      <div className="bg-surface-card border border-surface-border rounded-xl divide-y divide-surface-border">
        {tasks.length === 0 ? (
          <p className="text-text-muted text-sm p-6 font-body text-center">No tasks found. Add one above!</p>
        ) : (
          tasks.map((task) =>
            editingId === task.id ? (
              /* Edit Mode */
              <div key={task.id} className="p-4 bg-surface-card-hover space-y-3">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="flex-1 bg-surface-primary border border-surface-border rounded-lg px-3 py-2 text-sm text-text-primary font-body focus:outline-none focus:border-brand-purple/50"
                    autoFocus
                  />
                  <button onClick={() => saveEdit(task.id)} className="p-2 text-brand-green hover:bg-brand-green/10 rounded-lg transition-colors" title="Save">
                    <Save size={16} />
                  </button>
                  <button onClick={cancelEditing} className="p-2 text-text-muted hover:text-text-primary hover:bg-surface-primary rounded-lg transition-colors" title="Cancel">
                    <X size={16} />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-xs text-text-muted mb-1 font-display uppercase tracking-wider">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value as TaskCategory })}
                      className="w-full bg-surface-primary border border-surface-border rounded-lg px-2 py-1.5 text-xs text-text-primary font-body focus:outline-none focus:border-brand-purple/50"
                    >
                      <option value="professional">Professional</option>
                      <option value="personal">Personal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1 font-display uppercase tracking-wider">Priority</label>
                    <select
                      value={editForm.priority}
                      onChange={(e) => setEditForm({ ...editForm, priority: e.target.value as TaskPriority })}
                      className="w-full bg-surface-primary border border-surface-border rounded-lg px-2 py-1.5 text-xs text-text-primary font-body focus:outline-none focus:border-brand-purple/50"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="urgent">Urgent</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1 font-display uppercase tracking-wider">Project</label>
                    <input
                      type="text"
                      value={editForm.project}
                      onChange={(e) => setEditForm({ ...editForm, project: e.target.value })}
                      placeholder="Optional"
                      className="w-full bg-surface-primary border border-surface-border rounded-lg px-2 py-1.5 text-xs text-text-primary placeholder-text-muted font-body focus:outline-none focus:border-brand-purple/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1 font-display uppercase tracking-wider">Work On</label>
                    <input
                      type="date"
                      value={editForm.scheduled_date}
                      onChange={(e) => setEditForm({ ...editForm, scheduled_date: e.target.value })}
                      className="w-full bg-surface-primary border border-surface-border rounded-lg px-2 py-1.5 text-xs text-text-primary font-body focus:outline-none focus:border-brand-purple/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-text-muted mb-1 font-display uppercase tracking-wider">Due Date</label>
                    <input
                      type="date"
                      value={editForm.due_date}
                      onChange={(e) => setEditForm({ ...editForm, due_date: e.target.value })}
                      className="w-full bg-surface-primary border border-surface-border rounded-lg px-2 py-1.5 text-xs text-text-primary font-body focus:outline-none focus:border-brand-purple/50"
                    />
                  </div>
                </div>
              </div>
            ) : (
              /* Display Mode */
              <div key={task.id} className="flex items-center gap-3 md:gap-4 p-3 md:p-4 hover:bg-surface-card-hover transition-colors group">
                <button onClick={() => toggleStatus(task.id, task.status)} className="flex-shrink-0">
                  {statusIcon(task.status)}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-body text-sm ${task.status === 'completed' ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                    {task.title}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 md:gap-3 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      task.category === 'professional' ? 'bg-brand-purple/15 text-brand-purple' : 'bg-brand-cyan/15 text-brand-cyan'
                    }`}>
                      {task.category}
                    </span>
                    {task.project && <span className="text-xs text-text-muted font-mono">{task.project}</span>}
                    {task.scheduled_date && <span className="text-xs text-brand-amber font-mono">work: {task.scheduled_date}</span>}
                    {task.due_date && <span className="text-xs text-text-muted font-mono">due: {task.due_date}</span>}
                    <span className={`text-xs ${
                      task.priority === 'urgent' ? 'text-brand-red' :
                      task.priority === 'high' ? 'text-brand-amber' : 'text-text-muted'
                    }`}>
                      {task.priority}
                    </span>
                    {task.clickup_url && (
                      <a
                        href={task.clickup_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-1 text-xs text-brand-purple hover:text-brand-magenta transition-colors"
                      >
                        <ExternalLink size={11} />
                        ClickUp
                      </a>
                    )}
                  </div>
                </div>
                {task.clickup_url && (
                  <a
                    href={task.clickup_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-brand-purple transition-all"
                    title="Open in ClickUp"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}
                <button onClick={() => startEditing(task)} className="md:opacity-0 md:group-hover:opacity-100 text-text-muted hover:text-brand-purple transition-all" title="Edit">
                  <Pencil size={16} />
                </button>
                <button onClick={() => deleteTask(task.id)} className="md:opacity-0 md:group-hover:opacity-100 text-text-muted hover:text-brand-red transition-all" title="Delete">
                  <Trash2 size={16} />
                </button>
              </div>
            )
          )
        )}
      </div>
    </div>
  );
}
