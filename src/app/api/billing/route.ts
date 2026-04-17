import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { getClickUpTeams, getMonthlyBillingEntries, type BillingEntry } from '@/lib/clickup';

export async function GET(req: NextRequest) {
  try {
    requireAuth(req);

    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year = parseInt(searchParams.get('year') || String(now.getFullYear()));
    // Default to previous month (billing is done at end of month for the prior month)
    const month = parseInt(searchParams.get('month') || String(now.getMonth())); // 0-indexed
    const format = searchParams.get('format') || 'json';

    const teamsData = await getClickUpTeams();
    const teamId = teamsData.teams?.[0]?.id;
    if (!teamId) {
      return NextResponse.json({ error: 'No ClickUp team found' }, { status: 400 });
    }

    const entries = await getMonthlyBillingEntries(teamId, year, month);

    if (format === 'csv') {
      const csv = buildBillingCSV(entries);
      const monthName = new Date(year, month).toLocaleString('en-US', { month: 'long' });
      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="billing-${monthName}-${year}.csv"`,
        },
      });
    }

    return NextResponse.json({ year, month, entries });
  } catch (e) {
    if (e instanceof AuthError) return NextResponse.json({ error: e.message }, { status: 401 });
    const message = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function escapeCSV(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return `"${val}"`;
}

function buildBillingCSV(entries: BillingEntry[]): string {
  const lines: string[] = [];

  // Header row
  lines.push('"Date ","Project ","Who ","Description ","Project category ","Company ","Decimal hours ","Billable",""');

  // Group entries by project
  const groups = new Map<string, BillingEntry[]>();
  for (const entry of entries) {
    const key = entry.project;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(entry);
  }

  // For each project group: subtotal row first, then entries sorted by date
  for (const [, groupEntries] of groups) {
    // Sort entries by date descending (newest first, matching the example)
    groupEntries.sort((a, b) => {
      const da = new Date(a.date).getTime();
      const db = new Date(b.date).getTime();
      return db - da;
    });

    // Subtotal row (blank except hours and amount columns)
    const totalHours = Math.round(groupEntries.reduce((sum, e) => sum + e.decimalHours, 0) * 1000) / 1000;
    lines.push(`"","","","","","",${escapeCSV(String(totalHours))},"",""`);

    // Individual time entries
    for (const entry of groupEntries) {
      lines.push([
        escapeCSV(entry.date),
        escapeCSV(entry.project),
        escapeCSV(entry.who),
        escapeCSV(entry.description),
        escapeCSV(entry.projectCategory),
        escapeCSV(entry.company),
        escapeCSV(String(entry.decimalHours)),
        escapeCSV(entry.billable ? 'Yes' : 'No'),
        '""',
      ].join(','));
    }
  }

  return lines.join('\n');
}
