'use client';

import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Delete',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel();
    }

    document.addEventListener('keydown', onKey);
    
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.35)',
      }}
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div
        className="bg-paper rounded-[12px] border border-chalk p-[28px] shadow-lg"
        style={{ width: 380, maxWidth: 'calc(100vw - 32px)' }}
      >
        <h2 className="font-display text-[22px] font-normal text-ink m-0 mb-[8px]">{title}</h2>
        <p className="font-ui text-[13px] text-ash m-0 mb-[24px]">{message}</p>
        <div className="flex items-center justify-end gap-[8px]">
          <Button type="button" variant="ghost" size="md" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="button" variant="solid" tone="rose" size="md" onClick={onConfirm} disabled={loading}>
            {loading ? 'Deleting…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
