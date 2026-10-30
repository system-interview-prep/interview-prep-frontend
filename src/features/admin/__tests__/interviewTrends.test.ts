import { describe, expect, it } from 'vitest';
import { monthLabel } from '../components/InterviewTrends';

describe('monthLabel', () => {
  it('labels year-month buckets with the short year', () => {
    expect(monthLabel('12/2026')).toBe('Th12/26');
    expect(monthLabel('01/2027')).toBe('Th1/27');
  });

  it('still reads the older English month names', () => {
    expect(monthLabel('Oct')).toBe('Th10');
    expect(monthLabel('weird')).toBe('weird');
  });
});
