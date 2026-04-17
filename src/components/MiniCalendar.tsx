'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import type { CalendarEventRow } from '@/lib/db';

export default function MiniCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventRow[]>([]);

  useEffect(() => {
    fetch('/api/calendar').then((r) => r.json()).then((data) => setEvents(data.events || []));
  }, []);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let day = calStart;
  while (day <= calEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  function hasEvent(d: Date): boolean {
    const dateStr = format(d, 'yyyy-MM-dd');
    return events.some((e) => {
      const startDate = e.start.split('T')[0];
      const endDate = e.end.split('T')[0];
      return startDate === dateStr || (startDate <= dateStr && endDate > dateStr);
    });
  }

  const todaysEvents = events.filter((e) => {
    const dateStr = format(new Date(), 'yyyy-MM-dd');
    const startDate = e.start.split('T')[0];
    return startDate === dateStr;
  });

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider">Calendar</h3>
        <a href="/calendar" className="text-brand-purple text-xs hover:text-brand-magenta transition-colors font-body">
          Full View
        </a>
      </div>

      {/* Month Nav */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="text-text-muted hover:text-text-primary p-1">
          <ChevronLeft size={16} />
        </button>
        <span className="text-sm font-display font-semibold text-text-primary">
          {format(currentMonth, 'MMMM yyyy')}
        </span>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="text-text-muted hover:text-text-primary p-1">
          <ChevronRight size={16} />
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((d) => (
          <div key={d} className="text-center text-xs text-text-muted font-mono py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day Grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const dayHasEvent = hasEvent(d);
          return (
            <div
              key={i}
              className={`text-center text-xs py-1.5 rounded-md relative cursor-default transition-colors ${
                !isSameMonth(d, monthStart)
                  ? 'text-text-muted/30'
                  : isToday(d)
                  ? 'bg-brand-purple text-white font-bold'
                  : 'text-text-primary hover:bg-surface-card-hover'
              }`}
            >
              {format(d, 'd')}
              {dayHasEvent && !isToday(d) && (
                <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-brand-cyan" />
              )}
            </div>
          );
        })}
      </div>

      {/* Today's Events */}
      {todaysEvents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-surface-border">
          <p className="text-xs text-text-muted font-display uppercase tracking-wider mb-2">Today</p>
          <div className="space-y-2">
            {todaysEvents.slice(0, 3).map((event) => (
              <div key={event.id} className="flex items-center gap-2 text-xs">
                <CalendarDays size={12} className="text-brand-cyan flex-shrink-0" />
                <span className="text-text-primary font-body truncate">{event.summary}</span>
                <span className="text-text-muted font-mono ml-auto flex-shrink-0">
                  {event.allDay ? 'All day' : format(parseISO(event.start), 'h:mm a')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
