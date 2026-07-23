import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('drops falsy values', () => {
    const isHidden: boolean = false;
    expect(cn('flex', isHidden && 'hidden', undefined, null, 'gap-2')).toBe('flex gap-2');
  });

  it('lets a later conflicting Tailwind class win', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });
});
