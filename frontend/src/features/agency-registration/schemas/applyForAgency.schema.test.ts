import { describe, expect, it } from 'vitest';
import { ApplyForAgencySchema } from './applyForAgency.schema';

describe('ApplyForAgencySchema (unit)', () => {
  it('accepts well-formed social links', () => {
    const result = ApplyForAgencySchema.safeParse({
      name: 'Nairobi Homes',
      logoUrl: 'https://example.com/logo.png',
      socialLinks: { website: 'https://nairobihomes.example', facebook: 'https://facebook.com/nairobihomes' },
    });
    expect(result.success).toBe(true);
  });

  // Security-review regression (decisions.md ADR-038): `.url()` alone
  // accepts `javascript:`/`data:` URIs, which AgencyDetailPage.tsx then
  // rendered as a clickable `href` — stored XSS. Confirms the fix is wired
  // through the actual schema a real submission goes through, not just the
  // `isHttpUrl` helper in isolation.
  it('rejects a javascript: URI in any social link field', () => {
    const result = ApplyForAgencySchema.safeParse({
      name: 'Nairobi Homes',
      socialLinks: { website: 'javascript:alert(document.cookie)' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects a javascript: URI as logoUrl', () => {
    const result = ApplyForAgencySchema.safeParse({
      name: 'Nairobi Homes',
      logoUrl: 'javascript:alert(document.cookie)',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a data: URI social link', () => {
    const result = ApplyForAgencySchema.safeParse({
      name: 'Nairobi Homes',
      socialLinks: { website: 'data:text/html,<script>alert(1)</script>' },
    });
    expect(result.success).toBe(false);
  });
});
