import { Category, Currency, ProductSummary } from './models';

/** Tipo de cambio fijo del obligatorio original. */
export const UYU_PER_USD = 40;
export const toUsd = (cost: number, currency: Currency) => (currency === 'UYU' ? cost / UYU_PER_USD : cost);
export const money = (n: number) => n.toLocaleString('es-UY', { maximumFractionDigits: 2 });

export type CategorySort = 'az' | 'za' | 'count';
export type ProductSort = 'asc' | 'desc' | 'sold';
export interface Range { min: number | null; max: number | null; }

const inRange = (n: number, { min, max }: Range) => (min == null || n >= min) && (max == null || n <= max);

export function listCategories(items: Category[], sort: CategorySort | null, range: Range): Category[] {
  const out = items.filter((c) => inRange(Number(c.productCount), range));
  if (sort === 'az') out.sort((a, b) => a.name.localeCompare(b.name, 'es'));
  if (sort === 'za') out.sort((a, b) => b.name.localeCompare(a.name, 'es'));
  if (sort === 'count') out.sort((a, b) => Number(b.productCount) - Number(a.productCount));
  return out;
}

export function listProducts(items: ProductSummary[], sort: ProductSort | null, range: Range, query: string): ProductSummary[] {
  const q = query.trim().toLowerCase();
  const out = items.filter(
    (p) => inRange(p.cost, range) && (!q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)),
  );
  if (sort === 'asc') out.sort((a, b) => a.cost - b.cost);
  if (sort === 'desc') out.sort((a, b) => b.cost - a.cost);
  if (sort === 'sold') out.sort((a, b) => b.soldCount - a.soldCount);
  return out;
}

export const SHIPPING = [
  { id: 'premium', label: 'Premium', days: '2 a 5 días', rate: 0.15 },
  { id: 'express', label: 'Express', days: '5 a 8 días', rate: 0.07 },
  { id: 'standard', label: 'Standard', days: '12 a 15 días', rate: 0.05 },
] as const;

export const PUBLICATION = [
  { id: 'gold', label: 'Gold', rate: 0.13 },
  { id: 'premium', label: 'Premium', rate: 0.07 },
  { id: 'standard', label: 'Estándar', rate: 0.03 },
] as const;

export const round2 = (n: number) => Math.round(n * 100) / 100;
export function cartTotals(lines: { unitCost: number; currency: Currency; count: number }[], rate: number) {
  const subtotal = round2(lines.reduce((s, l) => s + toUsd(l.unitCost, l.currency) * l.count, 0));
  const shipping = round2(subtotal * rate);
  return { subtotal, shipping, total: round2(subtotal + shipping) };
}
export function publicationTotal(cost: number, rate: number) {
  const commission = round2(cost * rate);
  return { commission, total: round2(cost + commission) };
}
