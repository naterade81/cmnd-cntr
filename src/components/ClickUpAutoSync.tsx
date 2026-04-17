'use client';

import { useEffect, useRef } from 'react';

const SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

export default function ClickUpAutoSync() {
  const hasSynced = useRef(false);

  useEffect(() => {
    async function sync() {
      try {
        const res = await fetch('/api/clickup', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sync' }),
        });
        const data = await res.json();
        if (data.synced !== undefined) {
          console.log(`[ClickUp] Synced ${data.synced} tasks`);
        }
      } catch {
        // Silent fail — token may not be configured yet
      }
    }

    // Sync on initial load (once)
    if (!hasSynced.current) {
      hasSynced.current = true;
      sync();
    }

    // Poll every 15 minutes
    const interval = setInterval(sync, SYNC_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  return null;
}
