import { Component, OnDestroy, OnInit, afterNextRender, inject, signal } from '@angular/core';
import Lenis from 'lenis';
import { animate } from 'motion';
import { NavigationEnd, NavigationStart, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartService } from './core/cart.service';
import { DataService } from './core/data.service';
import { reducedMotion, setIntroDelay } from './core/motion';
import { SessionService } from './core/session.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    @if (intro() !== null) { <div class="intro" id="intro" aria-hidden="true">{{ intro() }}</div> }
    <a class="skip" href="#contenido" (click)="skip($event)">Saltar al contenido</a>
    @if (data.loading()) { <div class="loadbar" role="status" aria-label="Cargando"></div> }
    <header class="top">
      <a routerLink="/" class="logo" aria-label="eMercado, inicio">eMercado</a>
      <nav aria-label="Principal">
        <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">Inicio</a>
        <a routerLink="/categorias" routerLinkActive="on">Categorías</a>
        <a routerLink="/vender" routerLinkActive="on">Vender</a>
      </nav>
      <div class="top-right">
        @if (session.loggedIn()) {
          <details class="menu" #menu>
            <summary>{{ session.name() }}</summary>
            <div class="menu-list" (click)="menu.open = false">
              <a routerLink="/carrito">Mi carrito</a>
              <a routerLink="/perfil">Mi perfil</a>
              <button type="button" (click)="logout()">Cerrar sesión</button>
            </div>
          </details>
        } @else {
          <a routerLink="/ingresar" class="link-login">Iniciar sesión</a>
        }
        <a routerLink="/carrito" id="bolsa" class="bag" [attr.aria-label]="'Bolsa, ' + cart.count() + ' artículos'">
          Bolsa <b>{{ cart.count() }}</b>
        </a>
      </div>
    </header>
    <main id="contenido" tabindex="-1"><router-outlet /></main>
    <footer class="foot">
      <p>Sitio de demostración: no vende ni cobra nada de verdad. Nació como obligatorio de
        <a href="https://jovenesaprogramar.edu.uy/" target="_blank" rel="noopener">Jóvenes a Programar</a>,
        y lo rehízo <a href="https://github.com/nahuelbenitezs" target="_blank" rel="noopener">Nahuel Benítez</a> en Angular.</p>
      <p><a href="Letra.pdf" target="_blank" rel="noopener">Descargá la letra del obligatorio</a> ·
        <a href="#" (click)="top($event)">Volver arriba</a></p>
      <p class="foot-big" aria-hidden="true">eMercado</p>
    </footer>
  `,
})
export class App implements OnInit, OnDestroy {
  readonly intro = signal<number | null>(null);
  private lenis?: Lenis;
  private sub?: { unsubscribe(): void };
  readonly data = inject(DataService);
  readonly session = inject(SessionService);
  readonly cart = inject(CartService);
  private router = inject(Router);

  constructor() {
    if (!reducedMotion() && !sessionStorage.getItem('intro')) {
      sessionStorage.setItem('intro', '1');
      this.intro.set(0);
      setIntroDelay(0.9);
      afterNextRender(() => this.playIntro());
    }
    afterNextRender(() => this.smoothScroll());
  }

  /** Entrada corta, solo la primera vez en la sesión. */
  private playIntro() {
    const done = () => { this.intro.set(null); setIntroDelay(0); };
    const safety = setTimeout(done, 2200); // una pestaña oculta no avanza animaciones
    animate(0, 100, { duration: 0.8, ease: 'easeOut', onUpdate: (v) => this.intro.set(Math.round(v)) }).finished.then(() => {
      const el = document.getElementById('intro');
      if (!el) return;
      animate(el, { clipPath: ['inset(0 0 0% 0)', 'inset(0 0 100% 0)'] }, { duration: 0.55, ease: [0.76, 0, 0.24, 1] }).finished.then(() => { clearTimeout(safety); done(); });
    });
  }

  /** Scroll suave solo con mouse: en táctil manda el scroll nativo. */
  private smoothScroll() {
    if (reducedMotion() || !matchMedia('(pointer: fine)').matches) return;
    this.lenis = new Lenis({ autoRaf: true, lerp: 0.11 });
    let back = false;
    this.sub = this.router.events.subscribe((e) => {
      if (e instanceof NavigationStart) back = e.navigationTrigger === 'popstate';
      if (e instanceof NavigationEnd && !back) this.lenis?.scrollTo(0, { immediate: true, force: true });
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); this.lenis?.destroy(); }
  ngOnInit() { this.cart.seedDemo().catch(() => undefined); }
  logout() { this.session.logout(); this.router.navigateByUrl('/'); }
  top(e: Event) { e.preventDefault(); window.scrollTo({ top: 0 }); }
  skip(e: Event) { e.preventDefault(); document.getElementById('contenido')?.focus(); }
}
