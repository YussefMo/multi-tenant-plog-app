import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
  it('joins class names', () => {
    expect(cn('flex', 'items-center')).toBe('flex items-center');
  });

  it('lets later utilities win', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
  });

  it('ignores falsy values', () => {
    expect(cn('flex', false, undefined, null, 'gap-2')).toBe('flex gap-2');
  });
});
