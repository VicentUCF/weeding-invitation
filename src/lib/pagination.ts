export const ADMIN_PAGE_SIZE = 20;

export function paginateItems<T>(items: T[], rawPage: string | null, pageSize = ADMIN_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const requestedPage = rawPage && /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Math.min(Number.isSafeInteger(requestedPage) ? requestedPage : 1, pageCount);
  const offset = (page - 1) * pageSize;

  return {
    items: items.slice(offset, offset + pageSize),
    page,
    pageCount,
    total: items.length,
    start: items.length ? offset + 1 : 0,
    end: Math.min(offset + pageSize, items.length),
  };
}
