import { Component, ElementRef, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { money } from '../core/catalog';
import { DataService } from '../core/data.service';
import { Comment, Product } from '../core/models';
import { Reveal, flyToBag } from '../core/motion';
import { SessionService } from '../core/session.service';

const pad = (n: number) => String(n).padStart(2, '0');
export const stamp = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

@Component({
  imports: [FormsModule, RouterLink, Reveal],
  template: `
    @if (error()) { <section class="page"><h1 class="title">Producto no encontrado</h1><a class="btn" routerLink="/categorias">Ver los puestos</a></section> }
    @if (p(); as p) {
      <section class="page product">
        <div class="gallery" role="group" aria-roledescription="carrusel" [attr.aria-label]="'Imágenes de ' + p.name">
          <div class="gallery-main">
            <img #photo [src]="p.images[slide()]" [alt]="p.name + ', imagen ' + (slide() + 1) + ' de ' + p.images.length" />
            <button type="button" class="arrow prev" (click)="move(-1)" aria-label="Imagen anterior">←</button>
            <button type="button" class="arrow next" (click)="move(1)" aria-label="Imagen siguiente">→</button>
          </div>
          <div class="thumbs">
            @for (src of p.images; track src; let i = $index) {
              <button type="button" [class.on]="i === slide()" (click)="slide.set(i)" [attr.aria-label]="'Ver imagen ' + (i + 1)"><img [src]="src" alt="" loading="lazy" /></button>
            }
          </div>
        </div>
        <div class="buy">
          <a routerLink="/categorias" class="back">{{ p.category }}</a>
          <h1 class="title title-product">{{ p.name }}</h1>
          <span class="tag tag-big" appReveal="stamp">{{ p.currency }} {{ fmt(p.cost) }}</span>
          <p>{{ p.description }}</p>
          <p><small>{{ p.soldCount }} vendidos</small></p>
          <button type="button" class="btn btn-big" (click)="buy(p)">Comprar</button>
        </div>
      </section>
      <section class="page">
        <h2 class="title title-small">Lo que dicen</h2>
        <ul class="reviews">
          @for (c of allComments(); track $index) {
            <li appReveal="slide">
              <span class="stars" role="img" [attr.aria-label]="c.score + ' de 5 estrellas'">{{ stars(c.score) }}</span>
              <b>{{ c.user }}</b> <small>{{ c.dateTime }}</small>
              <p>{{ c.description }}</p>
            </li>
          } @empty { <li>Todavía nadie opinó. ¡Estrenalo!</li> }
        </ul>
        @if (session.loggedIn()) {
          <form class="review-form" (submit)="send($event)">
            <h3>Dejá tu opinión</h3>
            <label>Tu opinión <textarea name="opinion" rows="3" required [(ngModel)]="opinion"></textarea></label>
            <label>Puntuación
              <select name="score" [(ngModel)]="score">@for (n of [1, 2, 3, 4, 5]; track n) { <option [ngValue]="n">{{ n }}</option> }</select>
            </label>
            <button class="btn">Enviar</button>
          </form>
        } @else { <p><a routerLink="/ingresar">Iniciá sesión</a> para dejar tu opinión.</p> }
      </section>
      @if (p.relatedProducts.length) {
        <section class="page">
          <h2 class="title title-small">También te puede gustar</h2>
          <div class="grid grid-small">
            @for (r of p.relatedProducts; track r.id) {
              <a class="tile" [routerLink]="['/producto', r.id]" appReveal>
                <div class="tile-photo"><img [src]="r.image" [alt]="r.name" loading="lazy" /></div>
                <h3>{{ r.name }}</h3>
              </a>
            }
          </div>
        </section>
      }
    }
  `,
})
export class ProductPage {
  private data = inject(DataService);
  private cart = inject(CartService);
  private router = inject(Router);
  readonly session = inject(SessionService);
  readonly id = input.required<string>();
  readonly p = signal<Product | null>(null);
  readonly error = signal(false);
  readonly slide = signal(0);
  private apiComments = signal<Comment[]>([]);
  private mine = signal<Comment[]>([]);
  readonly allComments = computed(() => [...this.apiComments(), ...this.mine()]);
  private photo = viewChild<ElementRef<HTMLElement>>('photo');
  opinion = '';
  score = 5;
  readonly fmt = money;
  stars = (n: number) => '★'.repeat(n) + '☆'.repeat(5 - n);

  constructor() {
    effect(() => {
      const id = Number(this.id());
      this.p.set(null); this.error.set(false); this.slide.set(0);
      this.mine.set(JSON.parse(localStorage.getItem(`opiniones:${id}`) ?? '[]'));
      this.data.product(id).then((p) => { this.p.set(p); document.title = `${p.name} · eMercado`; }).catch(() => this.error.set(true));
      this.data.comments(id).then((c) => this.apiComments.set(c)).catch(() => this.apiComments.set([]));
    });
  }
  move(d: number) {
    const n = this.p()!.images.length;
    this.slide.update((s) => (s + d + n) % n);
  }
  async buy(p: Product) {
    this.cart.add(p);
    await flyToBag(this.photo()?.nativeElement ?? null);
    this.router.navigateByUrl('/carrito');
  }
  send(e: Event) {
    e.preventDefault();
    if (!this.opinion.trim()) return;
    const id = Number(this.id());
    this.mine.update((m) => [...m, { product: id, score: this.score, description: this.opinion.trim(), user: this.session.name(), dateTime: stamp(new Date()) }]);
    localStorage.setItem(`opiniones:${id}`, JSON.stringify(this.mine()));
    this.opinion = ''; this.score = 5;
  }
}
