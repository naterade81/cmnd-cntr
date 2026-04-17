export type TaskCategory = 'professional' | 'personal';
export type TaskStatus = 'pending' | 'in_progress' | 'completed';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Task {
  id: number;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  project: string | null;
  scheduled_date: string | null;
  due_date: string | null;
  completed_at: string | null;
  clickup_id: string | null;
  clickup_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface EffortLog {
  id: number;
  category: TaskCategory;
  project: string | null;
  hours: number;
  description: string | null;
  date: string;
  created_at: string;
}

export interface Goal {
  id: number;
  title: string;
  category: TaskCategory;
  target_value: number;
  current_value: number;
  unit: string;
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  location?: string;
  description?: string;
  calendar?: string;
  color?: string;
}

export interface DashboardStats {
  tasksToday: number;
  tasksCompleted: number;
  hoursThisWeek: number;
  activeProjects: number;
  streak: number;
}

export interface WeeklyEffort {
  day: string;
  professional: number;
  personal: number;
}

export interface TrendData {
  week: string;
  tasksCompleted: number;
  hoursLogged: number;
}

export interface ProjectProgress {
  name: string;
  category: TaskCategory;
  total: number;
  completed: number;
  percentage: number;
}

export type { DayOfWeek, WeeklyTask, WeeklyTaskNested, WeeklyTasksByDay } from './weekly';
