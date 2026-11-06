import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CategorySort, listCategories } from '../core/catalog';
import { DataService } from '../core/data.service';
import { Category } from '../core/models';
import { Reveal } from '../core/motion';

@Component({
  imports: [RouterLink, FormsModule, Reveal],
  template: `
    <section class="page">
      <h1 class="title">Los puestos</h1>
      <div class="tools" role="group" aria-label="Ordenar y filtrar categorías">
        <div class="segmented">
          <button type="button" [class.on]="sort() === 'az'" (click)="sort.set('az')">A-Z</button>
          <button type="button" [class.on]="sort() === 'za'" (click)="sort.set('za')">Z-A</button>
          <button type="button" [class.on]="sort() === 'count'" (click)="sort.set('count')">Más artículos</button>
        </div>
        <form class="range" (submit)="apply($event)">
          <label>Mín. <input type="number" min="0" name="min" [(ngModel)]="min" /></label>
          <label>Máx. <input type="number" min="0" name="max" [(ngModel)]="max" /></label>
          <button class="btn btn-small">Filtrar</button>
          <button type="button" class="btn-text" (click)="clear()">Limpiar</button>
        </form>
      </div>
      @if (error()) { <p class="alert" role="alert">No pudimos cargar las categorías. Probá recargar la página.</p> }
      <div class="stalls">
        @for (c of shown(); track c.id; let i = $index) {
          <a [class]="'stall stall-' + (i % 4)" [routerLink]="['/categorias', c.id]" appReveal [delay]="(i % 3) * 0.06">
            <img [src]="c.imgSrc" alt="" loading="lazy" />
            <h2>{{ c.name }}</h2>
            <p>{{ c.description }}</p>
            <small>{{ c.productCount }} artículos</small>
          </a>
        } @empty { @if (!data.loading() && !error()) { <p>Ningún puesto tiene esa cantidad de artículos.</p> } }
      </div>
    </section>
  `,
})
export class Categories {
  readonly data = inject(DataService);
  private all = signal<Category[]>([]);
  readonly error = signal(false);
  readonly sort = signal<CategorySort | null>(null);
  private range = signal<{ min: number | null; max: number | null }>({ min: null, max: null });
  min: number | null = null;
  max: number | null = null;
  readonly shown = computed(() => listCategories(this.all(), this.sort(), this.range()));

  constructor() { this.data.categories().then((c) => this.all.set(c)).catch(() => this.error.set(true)); }
  apply(e: Event) { e.preventDefault(); this.range.set({ min: this.min, max: this.max }); }
  clear() { this.min = this.max = null; this.range.set({ min: null, max: null }); }
}
