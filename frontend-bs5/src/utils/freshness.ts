// results older than this are re-queued by the API, matches STALE_AFTER in api.py
const HOUR = 1000 * 60 * 60;

export const lessThanOneHourAgo = (date: any) =>
  !!date && new Date(date).getTime() > Date.now() - HOUR;
