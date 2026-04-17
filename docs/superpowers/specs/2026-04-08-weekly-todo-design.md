# Weekly To-Do Planner — Design Spec

**Date:** 2026-04-08
**Status:** Approved

## Overview

A dedicated weekly to-do system for the CMDCTRL dashboard, separate from the existing task management and ClickUp integration. Organized by day → project → tasks with parent/child nesting. Accessible via a dashboard widget and a full-page weekly planning view.

## Data Model

New `weekly_tasks` SQLite table:

| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER PRIMARY KEY | Auto-increment |
| user_id | INTEGER NOT NULL | References users.id |
| week_start | TEXT NOT NULL | ISO date of week start, e.g. "2026-04-06" |
| day_of_week | TEXT NOT NULL | "monday" through "friday" |
| project | TEXT NOT NULL | Project name, e.g. "NEMRA", "MERCHBUTLER" |
| title | TEXT NOT NULL | Task text |
| parent_id | INTEGER NULL | References weekly_tasks.id for sub-tasks |
| sort_order | INTEGER DEFAULT 0 | Ordering within siblings |
| completed | INTEGER DEFAULT 0 | 0 or 1 |
| created_at | TEXT | ISO timestamp |
| updated_at | TEXT | ISO timestamp |

**Parent/child behavior:**
- Parent completion is derived: all children completed → parent auto-completes
- Checking a parent checks all its children
- Parent displays progress indicator (e.g., "1/3")
- Deleting a parent cascades to all children

**Week rollover** uses `weekly_rollover_pending` flag in `user_settings`.

## API Endpoints

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/weekly-tasks` | GET | Get tasks for a week (`?week_start=2026-04-06`). Returns nested structure (parents with children array). |
| `/api/weekly-tasks` | POST | Create a task. Body: `{ day_of_week, project, title, parent_id?, sort_order? }` |
| `/api/weekly-tasks/[id]` | PATCH | Update a task. Body: any of `{ title, completed, sort_order, day_of_week, project }`. Completing a parent completes all children. Completing a child recalculates parent status. |
| `/api/weekly-tasks/[id]` | DELETE | Delete a task. Cascades to children. |
| `/api/weekly-tasks/reorder` | PATCH | Bulk update sort_order for drag-and-drop. Body: `{ tasks: [{ id, sort_order, project? }] }` |
| `/api/weekly-tasks/rollover` | POST | Copy selected incomplete tasks to new week. Body: `{ tasks: [{ id, day_of_week }] }`. Creates new rows; previous week preserved. |

## UI: Dashboard Widget

Replaces the RecentTasks component in the dashboard home bottom row (alongside ProjectProgressChart and MiniCalendar).

**Layout:**
- Header: "Weekly To-Do" with date range (e.g., "Apr 6 – Apr 10") and "+" add button
- Day tabs: Mon / Tue / Wed / Thu / Fri
- Active tab highlighted with purple accent (#AF00F1)
- Today's tab auto-selected on load

**Tab content:**
- Project headers (bold) — each day can have multiple projects
- Tasks listed under each project with checkboxes
- Sub-tasks indented with smaller text
- Parent tasks show progress indicator (e.g., "1/3") next to checkbox
- Drag-and-drop reordering within a day/project, and between projects on the same day
- Empty state: "No tasks for this day" with "Add Task" button

**Add task (inline):**
- Click "+" → form: Day (pre-selected to current tab), Project (text input with autocomplete from existing projects this week), Task title, optional Parent (dropdown of tasks for that day/project)
- Submit adds immediately

## UI: Full-Page Weekly Planning View

New `/weekly` route, added to the sidebar navigation.

**Layout:**
- Header: "Weekly Plan" with date range and week navigation arrows (prev/next week)
- 5 columns (Mon–Fri), equal width
- Each column shows project headers and nested tasks, same visual pattern as the dashboard widget
- More vertical space for each day's content compared to the widget

**Features:**
- Drag-and-drop reordering within columns
- Drag tasks between columns to reassign to a different day
- Inline task adding per column (click "+" at bottom of column or under a project)
- Bulk operations: ability to add multiple tasks at once to a day/project

## UI: Week Rollover Modal

**Trigger:** Dashboard load when current date is past the previous week's range and rollover hasn't been dismissed for the new week.

**Modal layout:**
- Header: "New Week — Carry Over Tasks?"
- Incomplete tasks from previous week, grouped by project
- Each task has a checkbox (select/deselect) and a day dropdown (Mon–Fri) for placement
- Selecting a parent selects its incomplete children
- "Select All" / "Deselect All" at top
- Buttons: "Start Fresh" (dismiss, empty week) and "Carry Over Selected" (copies tasks)
- Sets `weekly_rollover_pending = false` after action so modal doesn't reappear

## Visual Style

Consistent with existing CMDCTRL dashboard:
- Dark theme with #AF00F1 purple accent
- Chakra Petch for headers, Exo 2 for body text, IBM Plex Mono for small details
- Card with subtle border, matching existing widget styling

## What's NOT Included

- Weekend tabs (can add later)
- ClickUp integration for weekly tasks (kept intentionally separate)
- Recurring/template weeks
