import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ProductSort, listProducts, money } from '../core/catalog';
import { DataService } from '../core/data.service';
import { ProductSummary } from '../core/models';
import { Reveal } from '../core/motion';

@Component({
  imports: [RouterLink, FormsModule, Reveal],
  template: `
    <section class="page">
      <a routerLink="/categorias" class="back">← Todos los puestos</a>
      <h1 class="title">{{ catName() || 'Productos' }}</h1>
      <div class="tools" role="group" aria-label="Buscar, ordenar y filtrar productos">
        <input class="search" type="search" placeholder="Buscar por nombre o descripción" aria-label="Buscar productos"
          [ngModel]="query()" (ngModelChange)="query.set($event)" />
        <div class="segmented">
          <button type="button" [class.on]="sort() === 'asc'" (click)="sort.set('asc')">Más baratos</button>
          <button type="button" [class.on]="sort() === 'desc'" (click)="sort.set('desc')">Más caros</button>
          <button type="button" [class.on]="sort() === 'sold'" (click)="sort.set('sold')">Más vendidos</button>
        </div>
        <form class="range" (submit)="apply($event)">
          <label>Precio mín. <input type="number" min="0" name="min" [(ngModel)]="min" /></label>
          <label>Precio máx. <input type="number" min="0" name="max" [(ngModel)]="max" /></label>
          <button class="btn btn-small">Filtrar</button>
          <button type="button" class="btn-text" (click)="clear()">Limpiar</button>
        </form>
      </div>
      @if (error()) { <p class="alert" role="alert">Este puesto no existe o no pudimos cargarlo.</p> }
      <div class="grid">
        @for (p of shown(); track p.id; let i = $index) {
          <a class="tile" [routerLink]="['/producto', p.id]" appReveal [delay]="(i % 3) * 0.06">
            <div class="tile-photo"><img [src]="p.image" [alt]="p.name" loading="lazy" /></div>
            <span class="tag">{{ p.currency }} {{ fmt(p.cost) }}</span>
            <h2>{{ p.name }}</h2>
            <p>{{ p.description }}</p>
            <small>{{ p.soldCount }} vendidos</small>
          </a>
        } @empty {
          @if (!data.loading() && !error()) {
            <div class="empty">
              @if (all().length) { <p>Nada coincide con esa búsqueda.</p> <button type="button" class="btn" (click)="reset()">Ver todo</button> }
              @else { <p>Este puesto todavía está vacío.</p> <a class="btn" routerLink="/vender">Vendé el primero</a> }
            </div>
          }
        }
      </div>
    </section>
  `,
})
export class Products {
  readonly data = inject(DataService);
  readonly id = input.required<string>();
  readonly all = signal<ProductSummary[]>([]);
  readonly catName = signal('');
  readonly error = signal(false);
  readonly query = signal('');
  readonly sort = signal<ProductSort | null>(null);
  private range = signal<{ min: number | null; max: number | null }>({ min: null, max: null });
  min: number | null = null;
  max: number | null = null;
  readonly fmt = money;
  readonly shown = computed(() => listProducts(this.all(), this.sort(), this.range(), this.query()));

  constructor() {
    effect(() => {
      this.data.products(Number(this.id()))
        .then((r) => { this.all.set(r.products); this.catName.set(r.catName); document.title = `${r.catName} · eMercado`; })
        .catch(() => this.error.set(true));
    });
  }
  apply(e: Event) { e.preventDefault(); this.range.set({ min: this.min, max: this.max }); }
  clear() { this.min = this.max = null; this.range.set({ min: null, max: null }); }
  reset() { this.clear(); this.query.set(''); }
}
