import { TestBed } from '@angular/core/testing';
import { CartService } from './cart.service';
import { API_BASE, DataService } from './data.service';
import { Product } from './models';
import { SessionService } from './session.service';

const ok = (v: unknown) => ({ ok: true, json: async () => v });
const product = { id: 7, name: 'X', cost: 10, currency: 'USD', images: ['a.jpg'] } as Product;

describe('DataService', () => {
  afterEach(() => vi.unstubAllGlobals());
  it('usa la API si responde y guarda en memoria', async () => {
    const f = vi.fn(async (_u: string) => ok([{ id: 1 }]));
    vi.stubGlobal('fetch', f);
    const d = TestBed.inject(DataService);
    await d.categories(); await d.categories();
    expect(f).toHaveBeenCalledTimes(1);
    expect(f).toHaveBeenCalledWith(API_BASE + 'cats/cat.json');
    expect(d.usingSnapshot()).toBe(false);
  });
  it('cae a la copia local si la API falla', async () => {
    const f = vi.fn(async (u: string) => { if (u.startsWith(API_BASE)) throw new Error('caída'); return ok([{ id: 2 }]); });
    vi.stubGlobal('fetch', f);
    const d = TestBed.inject(DataService);
    expect(await d.categories()).toEqual([{ id: 2 }]);
    expect(String(f.mock.calls[1][0])).toContain('data/cats/cat.json');
    expect(d.usingSnapshot()).toBe(true);
    expect(d.loading()).toBe(false);
  });
});

describe('CartService', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => vi.unstubAllGlobals());
  it('agrega, acumula, cambia cantidad, elimina y persiste', () => {
    const c = TestBed.inject(CartService);
    c.add(product); c.add(product);
    expect(c.count()).toBe(2);
    c.setCount(7, 0);
    expect(c.items()[0].count).toBe(1);
    expect(JSON.parse(localStorage.getItem('carrito')!)[0].id).toBe(7);
    c.remove(7);
    expect(c.items()).toEqual([]);
  });
  it('trae el artículo de ejemplo una sola vez: eliminarlo no lo revive', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ok({ articles: [{ id: 1, count: 1 }] })));
    const c = TestBed.inject(CartService);
    await c.seedDemo();
    expect(c.count()).toBe(1);
    c.remove(1);
    await c.seedDemo();
    expect(c.count()).toBe(0);
  });
});

describe('SessionService', () => {
  beforeEach(() => localStorage.clear());
  it('guarda el perfil por usuario', () => {
    const s = TestBed.inject(SessionService);
    s.login('ana@x.uy');
    expect(s.name()).toBe('ana');
    s.saveProfile({ firstName: 'Ana' } as never);
    expect(s.profile()?.firstName).toBe('Ana');
    s.logout();
    expect(s.loggedIn()).toBe(false);
    s.login('beto@x.uy');
    expect(s.profile()).toBeNull();
  });
});
