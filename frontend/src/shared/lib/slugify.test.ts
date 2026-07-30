import { describe, expect, it } from 'vitest';
import { slugify } from './slugify';

describe('slugify (unit)', () => {
  it('lowercases, hyphenates, and appends a uniqueness suffix', () => {
    const result = slugify('Modern 2BR Apartment in Kilimani');
    expect(result).toMatch(/^modern-2br-apartment-in-kilimani-[a-z0-9]{6}$/);
  });

  it('collapses punctuation and trims leading/trailing hyphens', () => {
    const result = slugify('  --Cozy Studio!! (Kileleshwa)--  ');
    expect(result).toMatch(/^cozy-studio-kileleshwa-[a-z0-9]{6}$/);
  });

  it('produces a different suffix on each call, so two identical titles never collide', () => {
    const a = slugify('Family Villa in Karen');
    const b = slugify('Family Villa in Karen');
    expect(a).not.toBe(b);
  });
});
