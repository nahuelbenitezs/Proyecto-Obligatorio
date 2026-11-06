import { Component, OnInit, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CartService } from './core/cart.service';
import { DataService } from './core/data.service';
import { SessionService } from './core/session.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
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
      <p class="foot-big">eMercado</p>
      <p>Sitio de demostración: no vende ni cobra nada de verdad. Nació como obligatorio de
        <a href="https://jovenesaprogramar.edu.uy/" target="_blank" rel="noopener">Jóvenes a Programar</a>,
        y lo rehízo <a href="https://github.com/nahuelbenitezs" target="_blank" rel="noopener">Nahuel Benítez</a> en Angular.</p>
      <p><a href="Letra.pdf" target="_blank" rel="noopener">Descargá la letra del obligatorio</a> ·
        <a href="#" (click)="top($event)">Volver arriba</a></p>
    </footer>
  `,
})
export class App implements OnInit {
  readonly data = inject(DataService);
  readonly session = inject(SessionService);
  readonly cart = inject(CartService);
  private router = inject(Router);

  ngOnInit() { this.cart.seedDemo().catch(() => undefined); }
  logout() { this.session.logout(); this.router.navigateByUrl('/'); }
  top(e: Event) { e.preventDefault(); window.scrollTo({ top: 0 }); }
  skip(e: Event) { e.preventDefault(); document.getElementById('contenido')?.focus(); }
}
