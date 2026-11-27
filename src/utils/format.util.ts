import type { SubsystemState } from '../types/mto.types.ts';

export function formatIdr(amount: number): string {
  if (Math.abs(amount) >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(2)}B`;
  }
  if (Math.abs(amount) >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(0)}M`;
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatShortDate(isoDate: string): string {
  const parsed = new Date(isoDate);
  if (Number.isNaN(parsed.getTime())) return isoDate;
  return parsed.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function getStateBadgeClass(state: SubsystemState): string {
  switch (state) {
    case 'Completed':
      return 'badge badge-success';
    case 'Delayed':
      return 'badge badge-error';
    case 'In Progress':
      return 'badge badge-info';
    case 'Pending':
      return 'badge badge-neutral';
  }
}
