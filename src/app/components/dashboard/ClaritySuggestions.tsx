'use client';

import { useState } from 'react';
import { Button } from '../../ui/Button';
import { Spark } from '../../ui/Spark';

// Placeholder content — there's no AI-suggestion backend yet. Once one
// exists, swap this static array for a real fetch.
const SUGGESTIONS = [
  {
    id: 'launch-v2',
    board: 'Launch v2.0',
    title: 'Three tasks for next sprint',
    body: 'CB-129 will need follow-ups. Want me to draft them and assign tentative owners?',
    action: 'Show drafts',
  },
  {
    id: 'mobile-slip',
    board: 'Mobile App',
    title: 'Mobile is slipping by 2 days',
    body: 'Velocity trended down for two sprints. I can split the iOS lane into vertical slices.',
    action: 'See the plan',
  },
  {
    id: 'growth-stale',
    board: 'Growth Experiments',
    title: 'Six stale tasks on Growth',
    body: 'Untouched for 3+ weeks. I’d archive them and surface the ones with traction.',
    action: 'Review',
  },
];

export function ClaritySuggestions() {
  const [dismissed, setDismissed] = useState<string[]>([]);
  const visible = SUGGESTIONS.filter(s => !dismissed.includes(s.id));

  return (
    <section>
      <h2 className="flex items-center gap-[6px] font-display text-[18px] font-normal text-ink mb-[12px]">
        <Spark size={14} color="var(--ember)" />
        Clarity &middot; across your boards
      </h2>

      {visible.length === 0 ? (
        <p className="font-ui text-[13px] text-ash italic">No suggestions right now.</p>
      ) : (
        <div className="flex flex-col gap-[10px]">
          {visible.map(s => (
            <div key={s.id} className="p-[14px] rounded-[10px] border border-ember bg-paper">
              <p className="font-mono text-[10px] text-ember tracking-[0.08em] uppercase mb-[6px]">{s.board}</p>
              <p className="font-ui font-semibold text-[13px] text-ink mb-[4px]">{s.title}</p>
              <p className="font-ui text-[12px] text-ash italic mb-[10px]">{s.body}</p>
              <div className="flex items-center gap-[8px]">
                <Button type="button" variant="solid" tone="ember" size="sm">
                  {s.action}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDismissed(prev => [...prev, s.id])}
                >
                  Dismiss
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
