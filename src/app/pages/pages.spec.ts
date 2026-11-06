import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CartService } from '../core/cart.service';
import { Product } from '../core/models';
import { SessionService } from '../core/session.service';
import { Cart } from './cart';
import { Categories } from './categories';
import { Login, decodeJwt } from './login';
import { ProductPage, stamp } from './product';
import { Products } from './products';
import { ProfilePage } from './profile';
import { Sell } from './sell';

const product = { id: 7, name: 'Silla', description: 'd', cost: 4000, currency: 'UYU', soldCount: 3, category: 'Muebles', images: ['a.jpg', 'b.jpg'], relatedProducts: [{ id: 8, name: 'Mesa', image: 'c.jpg' }] } as Product;
const routes: Record<string, unknown> = {
  'cats/cat.json': [{ id: 101, name: 'Autos', description: 'd', productCount: '5', imgSrc: 'a.jpg' }, { id: 104, name: 'Herramientas', description: 'd', productCount: '0', imgSrc: 'b.jpg' }],
  'cats_products/101.json': { catName: 'Autos', products: [{ id: 1, name: 'Onix', description: 'ciudad', cost: 10, currency: 'USD', soldCount: 1, image: 'a.jpg' }, { id: 2, name: 'Fiat', description: 'ruta', cost: 20, currency: 'USD', soldCount: 2, image: 'b.jpg' }] },
  'products/7.json': product,
  'products_comments/7.json': [{ product: 7, score: 4, description: 'Buena', user: 'juan', dateTime: '2020-01-01' }],
};
const setup = (imports: unknown[]) => TestBed.configureTestingModule({ imports: imports as never[], providers: [provideRouter([{ path: '**', children: [] }])] });
const text = (f: { nativeElement: HTMLElement }) => f.nativeElement.textContent ?? '';
const flush = async (f: { whenStable(): Promise<unknown> }) => { await new Promise((r) => setTimeout(r)); await f.whenStable(); };
const click = (f: { nativeElement: HTMLElement }, label: string) =>
  ([...f.nativeElement.querySelectorAll('button')] as HTMLButtonElement[]).find((b) => b.textContent?.trim() === label)!.click();

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal('fetch', vi.fn(async (u: string) => {
    const key = Object.keys(routes).find((k) => String(u).endsWith(k));
    if (!key) throw new Error('404');
    return { ok: true, json: async () => routes[key] };
  }));
});
afterEach(() => vi.unstubAllGlobals());

describe('páginas', () => {
  it('categorías: lista, ordena y filtra por cantidad', async () => {
    setup([Categories]);
    const f = TestBed.createComponent(Categories);
    await flush(f);
    expect(text(f)).toContain('Autos');
    click(f, 'Z-A'); await flush(f);
    expect(f.nativeElement.querySelector('h2').textContent).toBe('Herramientas');
    f.componentInstance.min = 1;
    f.componentInstance.apply(new Event('submit')); await flush(f);
    expect(text(f)).not.toContain('Herramientas');
    click(f, 'Limpiar'); await flush(f);
    expect(text(f)).toContain('Herramientas');
  });

  it('productos: busca, ordena y muestra vacío claro', async () => {
    setup([Products]);
    const f = TestBed.createComponent(Products);
    f.componentRef.setInput('id', '101');
    await flush(f);
    expect(text(f)).toContain('USD 10');
    click(f, 'Más caros'); await flush(f);
    expect(f.nativeElement.querySelector('h2').textContent).toBe('Fiat');
    f.componentInstance.query.set('ciudad'); await flush(f);
    expect(text(f)).not.toContain('Fiat');
    f.componentInstance.query.set('zzz'); await flush(f);
    expect(text(f)).toContain('Nada coincide');
  });

  it('producto: datos, carrusel, opiniones, relacionados y comprar', async () => {
    localStorage.setItem('carrito', '[]');
    setup([ProductPage]);
    TestBed.inject(SessionService).login('ana@x.uy');
    const f = TestBed.createComponent(ProductPage);
    f.componentRef.setInput('id', '7');
    await flush(f);
    for (const s of ['Silla', 'UYU', 'Muebles', '3 vendidos', 'Buena', 'juan', 'Mesa']) expect(text(f)).toContain(s);
    const c = f.componentInstance;
    c.move(-1); await flush(f);
    expect(f.nativeElement.querySelector('.gallery img').getAttribute('src')).toBe('b.jpg');
    c.opinion = 'Divina'; c.score = 2;
    c.send(new Event('submit')); await flush(f);
    expect(text(f)).toContain('Divina');
    expect(JSON.parse(localStorage.getItem('opiniones:7')!)[0].user).toBe('ana');
    await c.buy(product);
    expect(TestBed.inject(CartService).count()).toBe(1);
  });

  it('producto: la fecha de la opinión usa el mes correcto', () => {
    expect(stamp(new Date(2026, 0, 5, 9, 3, 7))).toBe('2026-01-05 09:03:07');
  });

  it('carrito: totales, validación y confirmación clara de demo, sin guardar la tarjeta', async () => {
    setup([Cart]);
    TestBed.inject(CartService).add(product);
    const f = TestBed.createComponent(Cart);
    await flush(f);
    expect(text(f)).toContain('Tienda de demostración');
    expect(text(f)).toContain('USD 100');
    const c = f.componentInstance;
    c.pay(new Event('submit')); await flush(f);
    expect(text(f)).toContain('Elegí un tipo de envío');
    expect(c.done()).toBe(false);
    c.ship = 'premium'; c.rate.set(c.rateOf('premium')); c.street = 'a'; c.number = '1'; c.corner = 'b'; c.method = 'card'; c.card = '4242';
    expect(c.valid()).toBe(false);
    c.exp = '12/30'; c.cvv = '123';
    await flush(f);
    expect(text(f)).toContain('USD 115');
    c.pay(new Event('submit')); await flush(f);
    expect(text(f)).toContain('no se cobró nada');
    expect(c.card).toBe('');
    expect(localStorage.getItem('carrito')).toBe('[]');
  });

  it('carrito: transferencia pide cuenta', () => {
    setup([Cart]);
    const c = TestBed.createComponent(Cart).componentInstance;
    c.method = 'bank';
    expect(c.paymentError()).toContain('cuenta');
    c.account = '1';
    expect(c.paymentError()).toBe('');
  });

  it('vender: valida, calcula comisión y avisa que es demo', async () => {
    setup([Sell]);
    const f = TestBed.createComponent(Sell);
    await flush(f);
    const c = f.componentInstance;
    c.publish(new Event('submit')); await flush(f);
    for (const s of ['Poné un nombre', 'Elegí una categoría', 'mayor a 0']) expect(text(f)).toContain(s);
    c.name = 'Bici'; c.category = 'Deporte'; c.cost.set(1000); c.rate.set(0.03);
    c.publish(new Event('submit')); await flush(f);
    expect(c.totals().total).toBe(1030);
    expect(text(f)).toContain('no se publicó de verdad');
  });

  it('perfil: exige obligatorios y guarda', async () => {
    setup([ProfilePage]);
    TestBed.inject(SessionService).login('ana@x.uy');
    const f = TestBed.createComponent(ProfilePage);
    const c = f.componentInstance;
    c.save(new Event('submit')); await flush(f);
    expect(text(f)).toContain('Completá');
    c.f.firstName = 'Ana'; c.f.firstSurname = 'Paz';
    c.save(new Event('submit')); await flush(f);
    expect(TestBed.inject(SessionService).profile()).toMatchObject({ firstName: 'Ana', email: 'ana@x.uy' });
  });

  it('login: valida, no guarda la contraseña y decodifica Google', async () => {
    setup([Login]);
    const f = TestBed.createComponent(Login);
    const c = f.componentInstance;
    c.login(new Event('submit')); await flush(f);
    expect(text(f)).toContain('Ingresá tu email');
    c.email = 'a@b.uy'; c.password = 'secreto';
    c.login(new Event('submit'));
    expect(TestBed.inject(SessionService).email()).toBe('a@b.uy');
    expect(JSON.stringify({ ...localStorage })).not.toContain('secreto');
    const token = 'x.' + btoa(JSON.stringify({ email: 'g@g.com' })).replace(/=+$/, '') + '.y';
    expect(decodeJwt(token).email).toBe('g@g.com');
  });
});
