import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/shared/lib/utils';
import { Input } from './input';

/**
 * A password `Input` with a show/hide toggle — every password field in the
 * app was missing this (Login, Register, Reset, Update password), found
 * during Sprint 8-adjacent manual testing. Drop-in replacement for
 * `<Input type="password" ...>`: same props, `type` just isn't accepted
 * since this component owns it internally.
 */
const PasswordInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<'input'>, 'type'>
>(({ className, ...props }, ref) => {
  const [visible, setVisible] = React.useState(false);

  return (
    <div className="relative">
      <Input type={visible ? 'text' : 'password'} className={cn('pr-9', className)} ref={ref} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 focus-visible:ring-2 focus-visible:outline-none"
        aria-label={visible ? 'Hide password' : 'Show password'}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  );
});
PasswordInput.displayName = 'PasswordInput';

export { PasswordInput };
