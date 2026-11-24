import { Language } from '../types/tapoyna';

const BAKU_OFFSET_MS = 4 * 60 * 60 * 1000;

export function formatAzn(minor: number): string {
  const sign = minor < 0 ? '-' : '';
  const abs = Math.abs(Math.round(minor));
  const azn = (abs / 100).toFixed(2);
  return `${sign}${azn} AZN`;
}

export function formatQepik(minor: number, lang: Language): string {
  const formatted = Math.round(minor).toLocaleString('en-US').replace(/,/g, ' ');
  if (lang === 'az') return `${formatted} qəpik`;
  if (lang === 'en') return `${formatted} qepik`;
  return `${formatted} qəpik`;
}

export function formatBakuTime(utcMs: number): string {
  const d = new Date(utcMs + BAKU_OFFSET_MS);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatBakuDateTime(utcMs: number): string {
  const d = new Date(utcMs + BAKU_OFFSET_MS);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${day}.${month} ${hh}:${mm}`;
}

export function formatUtcTime(utcMs: number): string {
  const d = new Date(utcMs);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  return `${hh}:${mm} UTC`;
}

export function formatDurationCompact(diffMs: number, lang: Language): string {
  const abs = Math.max(0, Math.floor(diffMs / 1000));
  const hrs = Math.floor(abs / 3600);
  const mins = Math.floor((abs % 3600) / 60);
  const secs = abs % 60;
  if (hrs > 0) {
    return `${hrs}${lang === 'en' ? 'h' : lang === 'az' ? 's' : 'ч'} ${String(mins).padStart(2, '0')}${lang === 'en' ? 'm' : lang === 'az' ? 'd' : 'м'}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/**
 * Deterministic top-up share calculation down to 1 qepik.
 * Sorted ascending by seatId; remainder qepiks assigned to highest seatIds
 * (e.g., 1000 qepik / 9 seats -> 8 x 111 + 1 x 112 qepik, matching spec section 7).
 */
export function calculateTopUpShares(
  deficitMinor: number,
  seatIds: number[],
): Record<number, number> {
  if (seatIds.length === 0 || deficitMinor <= 0) {
    return {};
  }
  const sorted = [...seatIds].sort((a, b) => a - b);
  const base = Math.floor(deficitMinor / sorted.length);
  const remainder = deficitMinor % sorted.length;
  const result: Record<number, number> = {};

  sorted.forEach((seatId, idx) => {
    // Assign the +1 qepik remainder deterministically to the tail seatIds
    const extra = idx >= sorted.length - remainder ? 1 : 0;
    result[seatId] = base + extra;
  });

  return result;
}
