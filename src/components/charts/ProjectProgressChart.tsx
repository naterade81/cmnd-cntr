'use client';

import type { ProjectProgress } from '@/types';

interface Props {
  projects: ProjectProgress[];
}

export default function ProjectProgressChart({ projects }: Props) {
  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-5">
      <h3 className="font-display text-sm font-semibold text-text-primary mb-4 uppercase tracking-wider">
        Project Progress
      </h3>
      {projects.length === 0 ? (
        <p className="text-text-muted text-sm font-body">No projects with tasks yet. Add tasks with a project name to track progress.</p>
      ) : (
        <div className="space-y-4">
          {projects.map((proj) => (
            <div key={proj.name}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-body text-text-primary">{proj.name}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-body ${
                      proj.category === 'professional'
                        ? 'bg-brand-purple/15 text-brand-purple'
                        : 'bg-brand-cyan/15 text-brand-cyan'
                    }`}
                  >
                    {proj.category}
                  </span>
                </div>
                <span className="text-xs text-text-muted font-mono">
                  {proj.completed}/{proj.total} ({proj.percentage}%)
                </span>
              </div>
              <div className="h-2 bg-surface-primary rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    proj.category === 'professional' ? 'bg-brand-purple' : 'bg-brand-cyan'
                  }`}
                  style={{ width: `${proj.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
