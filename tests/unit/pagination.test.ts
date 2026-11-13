import { describe, expect, it } from 'vitest';
import { paginateItems, paginationForTotal } from '../../src/lib/pagination';

describe('paginateItems', () => {
  const items = Array.from({ length: 300 }, (_, index) => index + 1);

  it('shows 20 items per page with correct range and total', () => {
    expect(paginateItems(items, '3')).toMatchObject({ page: 3, pageCount: 15, total: 300, start: 41, end: 60, items: items.slice(40, 60) });
  });

  it('clamps invalid or stale page numbers', () => {
    expect(paginateItems(items, '-2').page).toBe(1);
    expect(paginateItems(items, 'abc').page).toBe(1);
    expect(paginateItems(items, '99')).toMatchObject({ page: 15, start: 281, end: 300 });
  });

  it('keeps empty results on the first page', () => {
    expect(paginateItems([], '7')).toMatchObject({ items: [], page: 1, pageCount: 1, total: 0, start: 0, end: 0 });
  });

  it('calculates the same page metadata from a database count', () => {
    expect(paginationForTotal(122, '99')).toMatchObject({ page: 7, pageCount: 7, total: 122, start: 121, end: 122, offset: 120 });
  });
});
