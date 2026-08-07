import { describe, expect, it } from 'vitest';
import { isHttpUrl } from './url';

describe('isHttpUrl (unit)', () => {
  it('accepts http and https URLs', () => {
    expect(isHttpUrl('https://example.com')).toBe(true);
    expect(isHttpUrl('http://example.com/path?q=1')).toBe(true);
  });

  it('rejects javascript: URIs, even though they are syntactically valid URLs', () => {
    expect(isHttpUrl('javascript:alert(document.cookie)')).toBe(false);
  });

  it('rejects other non-http(s) schemes', () => {
    expect(isHttpUrl('data:text/html,<script>alert(1)</script>')).toBe(false);
    expect(isHttpUrl('vbscript:msgbox(1)')).toBe(false);
    expect(isHttpUrl('file:///etc/passwd')).toBe(false);
  });

  it('rejects unparseable strings', () => {
    expect(isHttpUrl('not a url')).toBe(false);
  });
});
