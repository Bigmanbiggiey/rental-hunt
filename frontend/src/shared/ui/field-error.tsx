import * as React from 'react';
import { AlertCircle } from 'lucide-react';

import { cn } from '@/shared/lib/utils';

export type FieldErrorProps = React.HTMLAttributes<HTMLParagraphElement>;

/**
 * Per ui-guidelines.md §14: rendered directly below the field, in `error`
 * color, prefixed with an AlertCircle icon, linked via the field's
 * `aria-describedby`.
 */
const FieldError = React.forwardRef<HTMLParagraphElement, FieldErrorProps>(
  ({ className, children, ...props }, ref) => (
    <p
      ref={ref}
      role="alert"
      className={cn('text-error flex items-center gap-1 text-sm', className)}
      {...props}
    >
      <AlertCircle className="size-4 shrink-0" aria-hidden="true" />
      {children}
    </p>
  ),
);
FieldError.displayName = 'FieldError';

export { FieldError };
