import { AfterViewInit, Component, ElementRef, OnDestroy, computed, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { animate, scroll } from 'motion';
import { money, topSold } from '../core/catalog';
import { DataService } from '../core/data.service';
import { startHeroGl } from '../core/hero-gl';
import { Category, ProductSummary } from '../core/models';
import { Magnetic, introDelay, reducedMotion } from '../core/motion';

const MANIFESTO = 'Autos, juguetes, muebles y computadoras. Una feria entera en tu pantalla, abierta a toda hora, donde todo se puede mirar y nada se cobra de verdad.'.split(' ');

@Component({
  imports: [RouterLink, Magnetic],
  template: `
    <section class="hero" #hero>
      <img class="hero-still" [src]="current()?.image ?? 'img/cars_index.jpg'" alt="" fetchpriority="high" />
      <canvas #gl aria-hidden="true"></canvas>
      <div class="hero-shade"></div>
      <div class="hero-copy">
        <p>Todo lo de la feria, sin madrugar.</p>
        <a routerLink="/categorias" class="btn btn-big" appMagnetic>Ver los puestos</a>
      </div>
      @if (current(); as c) {
        <a class="hero-now" [routerLink]="['/producto', c.id]">
          <span>{{ c.name }}</span><b>{{ c.currency }} {{ fmt(c.cost) }}</b>
        </a>
      }
      <h1 aria-label="eMercado">
        @for (l of letters; track $index) { <span class="clip" aria-hidden="true"><span class="letter">{{ l }}</span></span> }
      </h1>
    </section>

    <section class="manifesto" #manifesto>
      <p>
        @for (w of words; track $index) {
          <span class="word">{{ w }} </span>
          @if ($index === 4) {
            <picture class="inline-gif">
              <source srcset="img/vidriera.jpg" media="(prefers-reduced-motion: reduce)" />
              <img src="img/vidriera.gif" alt="" width="480" height="360" loading="lazy" />
            </picture>
          }
        }
      </p>
    </section>

    <section class="street" #street>
      <div class="street-pin">
        <h2>Recorré los puestos</h2>
        <div class="street-track" #track (focusin)="follow($event)">
          @for (c of cats(); track c.id) {
            <a class="booth" [routerLink]="['/categorias', c.id]">
              <div class="booth-photo"><img [src]="c.imgSrc" alt="" loading="lazy" /></div>
              <h3>{{ c.name }}</h3>
              <small>{{ c.productCount }} artículos</small>
            </a>
          }
          @if (cats().length) {
            <a class="booth booth-end" routerLink="/vender"><h3>Armá el tuyo</h3><small>Publicá un producto de prueba</small></a>
          }
        </div>
      </div>
    </section>

    <div class="marquee" aria-hidden="true"><div>
      @for (x of [1, 2, 3, 4]; track x) { <span>Lo más vendido de la feria ★&nbsp;</span> }
    </div></div>

    <section class="stack" #stack>
      @for (p of top(); track p.id) {
        <article class="stack-card">
          <a [routerLink]="['/producto', p.id]" [state]="{ foto: p.image }" (click)="name($event)">
            <img [src]="p.image" [alt]="p.name" loading="lazy" />
            <div class="stack-text">
              <h2>{{ p.name }}</h2>
              <p>{{ p.description }}</p>
              <span class="tag">{{ p.currency }} {{ fmt(p.cost) }}</span>
            </div>
          </a>
        </article>
      }
    </section>
  `,
})
export class Home implements AfterViewInit, OnDestroy {
  private data = inject(DataService);
  private hero = viewChild.required<ElementRef<HTMLElement>>('hero');
  private gl = viewChild.required<ElementRef<HTMLCanvasElement>>('gl');
  private manifesto = viewChild.required<ElementRef<HTMLElement>>('manifesto');
  private street = viewChild.required<ElementRef<HTMLElement>>('street');
  private track = viewChild.required<ElementRef<HTMLElement>>('track');
  private stack = viewChild.required<ElementRef<HTMLElement>>('stack');
  private stops: (() => void)[] = [];
  private pinned = false;

  readonly letters = [...'eMercado'];
  readonly words = MANIFESTO;
  readonly fmt = money;
  readonly cats = signal<Category[]>([]);
  readonly products = signal<ProductSummary[]>([]);
  readonly top = computed(() => topSold(this.products(), 5));
  readonly slides = computed(() => {
    const seen = new Set<string>();
    return this.top().filter((p) => !seen.has(p.currency + p.id) && seen.add(p.currency + p.id)).slice(0, 4);
  });
  private slide = signal(0);
  readonly current = computed<ProductSummary | undefined>(() => this.slides()[this.slide()]);

  constructor() {
    this.data.categories().then(async (cats) => {
      this.cats.set(cats);
      const lists = await Promise.all(cats.filter((c) => Number(c.productCount) > 0).map((c) => this.data.products(c.id)));
      this.products.set(lists.flatMap((l) => l.products));
      if (!reducedMotion()) {
        setTimeout(() => {
          this.stops.push(startHeroGl(this.gl().nativeElement, this.slides().map((s) => s.image), (i) => this.slide.set(i)));
          this.stackScroll();
        });
      }
    }).catch(() => undefined);
  }

  ngAfterViewInit() {
    if (reducedMotion()) return;
    const root = this.hero().nativeElement;
    animate(root.querySelectorAll('.letter'), { y: ['110%', '0%'] }, { duration: 0.9, delay: (i: number) => introDelay() + i * 0.04, ease: [0.16, 1, 0.3, 1] } as never);
    this.stops.push(scroll(animate(root.querySelector('h1')!, { y: [0, -90], opacity: [1, 0.2] }, { ease: 'linear' }), { target: root, offset: ['start start', 'end start'] }));

    const words = [...this.manifesto().nativeElement.querySelectorAll<HTMLElement>('.word')];
    words.forEach((w) => (w.style.opacity = '0.16'));
    this.stops.push(scroll((p: number) => {
      const lit = p * words.length;
      words.forEach((w, i) => (w.style.opacity = String(Math.min(1, Math.max(0.16, lit - i + 0.16)))));
    }, { target: this.manifesto().nativeElement, offset: ['start 75%', 'end 65%'] }));

    if (matchMedia('(min-width: 900px) and (pointer: fine)').matches) this.pinStreet();
  }

  /** Scroll horizontal: la sección se fija y la calle avanza de costado. En celular se desliza con el dedo. */
  private pinStreet() {
    const street = this.street().nativeElement;
    const track = this.track().nativeElement;
    this.pinned = true;
    street.classList.add('pinned');
    const fit = () => (street.style.height = `${track.scrollWidth - innerWidth + innerHeight}px`);
    const ro = new ResizeObserver(() => requestAnimationFrame(fit));
    ro.observe(track);
    this.stops.push(() => ro.disconnect());
    this.stops.push(scroll((p: number) => {
      track.style.transform = `translate3d(${-p * Math.max(0, track.scrollWidth - innerWidth)}px,0,0)`;
    }, { target: street, offset: ['start start', 'end end'] }));
  }

  /** Con teclado, llevar a la vista el puesto enfocado aunque la calle esté fijada. */
  follow(e: FocusEvent) {
    if (!this.pinned) return;
    const link = (e.target as HTMLElement).closest<HTMLElement>('.booth');
    if (!link) return;
    const street = this.street().nativeElement;
    const track = this.track().nativeElement;
    const ratio = link.offsetLeft / Math.max(1, track.scrollWidth - innerWidth);
    window.scrollTo({ top: street.offsetTop + Math.min(1, ratio) * (street.offsetHeight - innerHeight), behavior: 'instant' });
  }

  private stackScroll() {
    const cards = [...this.stack().nativeElement.querySelectorAll<HTMLElement>('.stack-card')];
    cards.slice(0, -1).forEach((card, i) => {
      this.stops.push(scroll(animate(card.firstElementChild!, { scale: [1, 0.9], opacity: [1, 0.45] }, { ease: 'linear' }), { target: cards[i + 1], offset: ['start end', 'start start'] }));
    });
  }

  /** La foto tocada viaja hasta el detalle del producto. */
  name(e: Event) {
    const img = (e.currentTarget as HTMLElement).querySelector('img');
    if (img) img.style.viewTransitionName = 'foto';
  }

  ngOnDestroy() { this.stops.forEach((s) => s()); }
}
