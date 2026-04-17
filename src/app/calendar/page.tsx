'use client';

import { useState, useEffect } from 'react';
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
import { ChevronLeft, ChevronRight, MapPin, Clock as ClockIcon, RefreshCw } from 'lucide-react';
import type { CalendarEventRow } from '@/lib/db';

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const [syncedAt, setSyncedAt] = useState<string | null>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  async function fetchEvents() {
    const res = await fetch('/api/calendar');
    const data = await res.json();
    setEvents(data.events || []);
    setSyncedAt(data.syncedAt);
  }

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

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  function eventsForDate(d: Date): CalendarEventRow[] {
    const dateStr = format(d, 'yyyy-MM-dd');
    return events.filter((e) => {
      const startDate = e.start.split('T')[0];
      const endDate = e.end.split('T')[0];
      return startDate === dateStr || (startDate <= dateStr && endDate > dateStr);
    });
  }

  const selectedEvents = eventsForDate(selectedDate);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h2 className="font-display text-xl md:text-2xl font-bold text-text-primary">Calendar</h2>
        <div className="flex items-center gap-4">
          {syncedAt && (
            <span className="text-text-muted text-xs font-mono hidden sm:inline">
              Synced {format(parseISO(syncedAt), 'MMM d, h:mm a')}
            </span>
          )}
          <div className="flex items-center gap-2 bg-surface-card border border-surface-border rounded-lg px-2 py-1">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors">
              <ChevronLeft size={18} />
            </button>
            <span className="font-display font-semibold text-text-primary min-w-[120px] md:min-w-[160px] text-center text-sm md:text-base">
              {format(currentMonth, 'MMMM yyyy')}
            </span>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1.5 text-text-muted hover:text-text-primary rounded transition-colors">
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Calendar Grid */}
        <div className="lg:col-span-2 bg-surface-card border border-surface-border rounded-xl overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 border-b border-surface-border">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-[10px] md:text-xs text-text-muted font-display uppercase tracking-wider py-2 md:py-3 border-r border-surface-border last:border-r-0">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 border-b border-surface-border last:border-b-0">
              {week.map((d, di) => {
                const dayEvents = eventsForDate(d);
                return (
                  <div
                    key={di}
                    onClick={() => setSelectedDate(d)}
                    className={`min-h-[50px] md:min-h-[100px] p-1 md:p-2 border-r border-surface-border last:border-r-0 cursor-pointer transition-colors ${
                      !isSameMonth(d, monthStart)
                        ? 'bg-surface-bg/50'
                        : isSameDay(d, selectedDate)
                        ? 'bg-brand-purple/10'
                        : 'hover:bg-surface-card-hover'
                    }`}
                  >
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 md:w-7 md:h-7 rounded-full text-xs md:text-sm font-body ${
                        isToday(d)
                          ? 'bg-brand-purple text-white font-bold'
                          : !isSameMonth(d, monthStart)
                          ? 'text-text-muted/30'
                          : 'text-text-primary'
                      }`}
                    >
                      {format(d, 'd')}
                    </span>
                    <div className="mt-0.5 md:mt-1 space-y-0.5">
                      {dayEvents.slice(0, 2).map((ev) => (
                        <div
                          key={ev.id}
                          className="text-[8px] md:text-[10px] px-1 md:px-1.5 py-0.5 rounded bg-brand-purple/20 text-brand-purple truncate font-body hidden sm:block"
                        >
                          {ev.allDay ? '' : format(parseISO(ev.start), 'h:mm') + ' '}{ev.summary}
                        </div>
                      ))}
                      {/* Mobile: just show a dot for events */}
                      {dayEvents.length > 0 && (
                        <div className="flex gap-0.5 justify-center sm:hidden">
                          {dayEvents.slice(0, 3).map((ev) => (
                            <div key={ev.id} className="w-1.5 h-1.5 rounded-full bg-brand-purple" />
                          ))}
                        </div>
                      )}
                      {dayEvents.length > 2 && (
                        <div className="text-[8px] md:text-[10px] text-text-muted px-1 md:px-1.5 font-body hidden sm:block">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Selected Date Detail Panel */}
        <div className="space-y-4">
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider mb-1">
              {format(selectedDate, 'EEEE')}
            </h3>
            <p className="text-text-muted text-xs font-body mb-4">
              {format(selectedDate, 'MMMM d, yyyy')}
            </p>

            {selectedEvents.length === 0 ? (
              <p className="text-text-muted text-sm font-body">No events scheduled.</p>
            ) : (
              <div className="space-y-3">
                {selectedEvents.map((ev) => (
                  <div key={ev.id} className="p-3 bg-surface-primary rounded-lg border border-surface-border">
                    <div className="flex items-start gap-2">
                      <div className="w-1 h-full min-h-[20px] rounded-full bg-brand-purple flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-body font-medium text-text-primary">{ev.summary}</p>
                        {!ev.allDay && (
                          <div className="flex items-center gap-1.5 mt-1 text-text-muted">
                            <ClockIcon size={12} />
                            <span className="text-xs font-mono">
                              {format(parseISO(ev.start), 'h:mm a')} – {format(parseISO(ev.end), 'h:mm a')}
                            </span>
                          </div>
                        )}
                        {ev.allDay && (
                          <span className="text-xs text-brand-cyan font-body mt-1 inline-block">All day</span>
                        )}
                        {ev.location && (
                          <div className="flex items-center gap-1.5 mt-1 text-text-muted">
                            <MapPin size={12} />
                            <span className="text-xs font-body truncate">{ev.location}</span>
                          </div>
                        )}
                        {ev.description && (
                          <p className="text-xs text-text-muted font-body mt-2 line-clamp-3">{ev.description}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming Events */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-5">
            <h3 className="font-display text-sm font-semibold text-text-primary uppercase tracking-wider mb-3">
              Upcoming
            </h3>
            <div className="space-y-2">
              {events
                .filter((e) => e.start >= format(new Date(), "yyyy-MM-dd'T'HH:mm:ss"))
                .slice(0, 5)
                .map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-card-hover cursor-pointer transition-colors"
                    onClick={() => {
                      const d = parseISO(ev.start);
                      setSelectedDate(d);
                      setCurrentMonth(d);
                    }}
                  >
                    <div className="text-center flex-shrink-0 w-10">
                      <p className="text-xs text-text-muted font-display uppercase">{format(parseISO(ev.start), 'MMM')}</p>
                      <p className="text-lg font-display font-bold text-text-primary leading-tight">{format(parseISO(ev.start), 'd')}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-body text-text-primary truncate">{ev.summary}</p>
                      <p className="text-xs text-text-muted font-mono">
                        {ev.allDay ? 'All day' : format(parseISO(ev.start), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
