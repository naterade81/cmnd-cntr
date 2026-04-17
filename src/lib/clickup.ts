const CLICKUP_API = 'https://api.clickup.com/api/v2';

export function getClickUpToken(userId: number = 1): string | null {
  try {
    const { getSetting } = require('./db');
    return getSetting(userId, 'clickup_token') ?? process.env.CLICKUP_TOKEN ?? null;
  } catch {
    return process.env.CLICKUP_TOKEN ?? null;
  }
}

export async function clickupFetch(endpoint: string, options: RequestInit = {}) {
  const token = getClickUpToken();
  if (!token) throw new Error('ClickUp API token not configured');

  const res = await fetch(`${CLICKUP_API}${endpoint}`, {
    ...options,
    headers: {
      'Authorization': token,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`ClickUp API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

export async function getClickUpTeams() {
  return clickupFetch('/team');
}

export async function getClickUpSpaces(teamId: string) {
  return clickupFetch(`/team/${teamId}/space?archived=false`);
}

export async function getClickUpTasks(listId: string) {
  return clickupFetch(`/list/${listId}/task?archived=false&include_closed=false`);
}

export async function getMyClickUpTasks(teamId: string, assigneeId?: string) {
  const params = new URLSearchParams({
    archived: 'false',
    include_closed: 'false',
    subtasks: 'true',
    order_by: 'due_date',
  });
  if (assigneeId) params.set('assignees[]', assigneeId);
  return clickupFetch(`/team/${teamId}/task?${params.toString()}`);
}

export async function getClickUpUser() {
  return clickupFetch('/user');
}

export async function findClickUpMember(teamId: string, name: string): Promise<string | null> {
  const teamsData = await clickupFetch('/team');
  const team = teamsData.teams?.find((t: { id: string }) => t.id === teamId);
  if (!team) return null;

  const lowerName = name.toLowerCase();
  const member = team.members?.find((m: { user: { username?: string; email?: string } }) => {
    const u = m.user;
    return (u.username?.toLowerCase().includes(lowerName)) ||
           (u.email?.toLowerCase().includes(lowerName));
  });

  return member?.user?.id?.toString() || null;
}

// --- Time Entries ---

export interface ClickUpTimeEntry {
  id: string;
  task: { id: string; name: string; status: { status: string } } | null;
  user: { id: number; username: string; email: string };
  start: string; // ms timestamp
  end: string;
  duration: string; // ms
  description: string;
  billable: boolean;
  task_location?: {
    space_id: string;
    folder_id: string;
    list_id: string;
    space_name?: string;
    folder_name?: string;
    list_name?: string;
  };
}

export async function getTimeEntries(teamId: string, startDate: Date, endDate: Date): Promise<ClickUpTimeEntry[]> {
  // Fetch all team members first to get everyone's time entries
  const teamsData = await clickupFetch('/team');
  const team = teamsData.teams?.find((t: { id: string }) => t.id === teamId);
  const memberIds = team?.members?.map((m: { user: { id: number } }) => m.user.id) || [];

  const params = new URLSearchParams({
    start_date: startDate.getTime().toString(),
    end_date: endDate.getTime().toString(),
  });

  // Include all team members' time entries
  if (memberIds.length > 0) {
    params.set('assignee', memberIds.join(','));
  }

  const data = await clickupFetch(`/team/${teamId}/time_entries?${params.toString()}`);
  return data.data || [];
}

export interface BillingEntry {
  date: string;       // MM/DD/YYYY
  project: string;
  who: string;
  description: string;
  projectCategory: string;
  company: string;
  decimalHours: number;
  billable: boolean;
}

export async function getMonthlyBillingEntries(teamId: string, year: number, month: number): Promise<BillingEntry[]> {
  // month is 0-indexed (0=Jan)
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);

  const entries = await getTimeEntries(teamId, startDate, endDate);

  // We need task details for project/folder/list info since time entries
  // may not include task_location. Fetch each unique task's details.
  const taskCache = new Map<string, { listName: string; folderName: string; spaceName: string }>();

  for (const entry of entries) {
    if (entry.task?.id && !taskCache.has(entry.task.id)) {
      try {
        const taskData = await clickupFetch(`/task/${entry.task.id}`);
        taskCache.set(entry.task.id, {
          listName: taskData.list?.name || '',
          folderName: taskData.folder?.name || '',
          spaceName: taskData.space?.id || '',
        });
      } catch {
        taskCache.set(entry.task.id, { listName: '', folderName: '', spaceName: '' });
      }
    }
  }

  return entries.map((entry) => {
    const durationMs = parseInt(entry.duration) || 0;
    const hours = Math.round((durationMs / 3600000) * 1000) / 1000;
    const date = new Date(parseInt(entry.start));
    const dateStr = `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;

    const taskInfo = entry.task?.id ? taskCache.get(entry.task.id) : null;
    const listName = entry.task_location?.list_name || taskInfo?.listName || '';
    const folderName = entry.task_location?.folder_name || taskInfo?.folderName || '';

    // Project = folder name or list name
    const project = folderName || listName || 'Uncategorized';
    // Company = derived from project name (the part after " / " or " - " if present, otherwise same as project)
    const company = project;

    return {
      date: dateStr,
      project,
      who: entry.user?.username || 'Unknown',
      description: entry.description || entry.task?.name || '',
      projectCategory: '', // left for manual categorization
      company,
      decimalHours: hours,
      billable: entry.billable ?? true,
    };
  });
}
