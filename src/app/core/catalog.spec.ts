import { topSold, cartTotals, listCategories, listProducts, publicationTotal, toUsd } from './catalog';
import { Category, ProductSummary } from './models';

const cats = [{ id: 1, name: 'Muebles', productCount: '4' }, { id: 2, name: 'Autos', productCount: '5' }, { id: 3, name: 'Deporte', productCount: '0' }] as Category[];
const prods = [
  { id: 1, name: 'Sofá', description: 'Grande', cost: 100, soldCount: 1 },
  { id: 2, name: 'Mesa', description: 'de sofá', cost: 300, soldCount: 9 },
  { id: 3, name: 'Silla', description: 'Chica', cost: 200, soldCount: 5 },
] as ProductSummary[];
const none = { min: null, max: null };
const ids = (a: { id: number }[]) => a.map((x) => x.id);

describe('catálogo', () => {
  it('ordena categorías A-Z, Z-A y por cantidad', () => {
    expect(ids(listCategories(cats, 'az', none))).toEqual([2, 3, 1]);
    expect(ids(listCategories(cats, 'za', none))).toEqual([1, 3, 2]);
    expect(ids(listCategories(cats, 'count', none))).toEqual([2, 1, 3]);
  });
  it('filtra categorías por rango, incluido el cero', () => {
    expect(ids(listCategories(cats, null, { min: 4, max: null }))).toEqual([1, 2]);
    expect(ids(listCategories(cats, null, { min: null, max: 0 }))).toEqual([3]);
  });
  it('no altera el arreglo original al ordenar', () => {
    listProducts(prods, 'desc', none, '');
    expect(ids(prods)).toEqual([1, 2, 3]);
  });
  it('ordena productos por precio y vendidos', () => {
    expect(ids(listProducts(prods, 'asc', none, ''))).toEqual([1, 3, 2]);
    expect(ids(listProducts(prods, 'desc', none, ''))).toEqual([2, 3, 1]);
    expect(ids(listProducts(prods, 'sold', none, ''))).toEqual([2, 3, 1]);
  });
  it('busca por nombre o descripción y combina con rango', () => {
    expect(ids(listProducts(prods, null, none, 'SOFÁ'))).toEqual([1, 2]);
    expect(ids(listProducts(prods, null, { min: 200, max: 300 }, 'sofá'))).toEqual([2]);
  });
});

describe('más vendidos', () => {
  it('toma los primeros sin alterar la lista', () => {
    expect(ids(topSold(prods, 2))).toEqual([2, 3]);
    expect(ids(prods)).toEqual([1, 2, 3]);
  });
});

describe('cuentas', () => {
  it('pasa pesos a dólares a 40', () => expect(toUsd(4000, 'UYU')).toBe(100));
  it('suma cantidades, monedas y envío', () => {
    const t = cartTotals([{ unitCost: 100, currency: 'USD', count: 2 }, { unitCost: 4000, currency: 'UYU', count: 1 }], 0.15);
    expect(t).toEqual({ subtotal: 300, shipping: 45, total: 345 });
  });
  it('calcula la comisión de publicación', () => expect(publicationTotal(1000, 0.07)).toEqual({ commission: 70, total: 1070 }));
});
