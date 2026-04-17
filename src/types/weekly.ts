export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday';

export interface WeeklyTask {
  id: number;
  user_id: number;
  week_start: string;
  day_of_week: DayOfWeek;
  project: string;
  title: string;
  parent_id: number | null;
  sort_order: number;
  completed: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

export interface WeeklyTaskNested extends WeeklyTask {
  children: WeeklyTaskNested[];
  childrenCompleted: number;
  childrenTotal: number;
}

export interface WeeklyTasksByDay {
  monday: WeeklyTaskNested[];
  tuesday: WeeklyTaskNested[];
  wednesday: WeeklyTaskNested[];
  thursday: WeeklyTaskNested[];
  friday: WeeklyTaskNested[];
}
