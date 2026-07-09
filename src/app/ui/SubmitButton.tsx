'use client';
import { useFormStatus } from 'react-dom';
import { Button } from './Button';
import type { ButtonProps } from './Button';

export function SubmitButton({
  children,
  pendingLabel = '…',
  ...props
}: ButtonProps & { pendingLabel?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" {...props} disabled={props.disabled || pending}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
