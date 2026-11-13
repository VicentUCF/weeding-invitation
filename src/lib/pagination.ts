export const ADMIN_PAGE_SIZE = 20;

export function paginationForTotal(total: number, rawPage: string | null, pageSize = ADMIN_PAGE_SIZE) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const requestedPage = rawPage && /^[1-9]\d*$/.test(rawPage) ? Number(rawPage) : 1;
  const page = Math.min(Number.isSafeInteger(requestedPage) ? requestedPage : 1, pageCount);
  const offset = (page - 1) * pageSize;

  return {
    page,
    pageCount,
    total,
    start: total ? offset + 1 : 0,
    end: Math.min(offset + pageSize, total),
    offset,
  };
}

export function paginateItems<T>(items: T[], rawPage: string | null, pageSize = ADMIN_PAGE_SIZE) {
  const pagination = paginationForTotal(items.length, rawPage, pageSize);
  return { ...pagination, items: items.slice(pagination.offset, pagination.offset + pageSize) };
}
