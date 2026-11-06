import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';

describe('App', () => {
  beforeEach(() => { localStorage.clear(); vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ articles: [] }) }))); });
  afterEach(() => vi.unstubAllGlobals());

  it('muestra navegación y login sin sesión, y el menú con sesión', async () => {
    TestBed.configureTestingModule({ imports: [App], providers: [provideRouter([])] });
    const f = TestBed.createComponent(App);
    await f.whenStable();
    let t = f.nativeElement.textContent;
    for (const s of ['Inicio', 'Categorías', 'Vender', 'Iniciar sesión', 'Volver arriba', 'demostración']) expect(t).toContain(s);
    f.componentInstance.session.login('ana@x.uy');
    await f.whenStable();
    t = f.nativeElement.textContent;
    for (const s of ['ana', 'Mi carrito', 'Mi perfil', 'Cerrar sesión']) expect(t).toContain(s);
    f.componentInstance.logout();
    await f.whenStable();
    expect(f.nativeElement.textContent).toContain('Iniciar sesión');
  });
});
