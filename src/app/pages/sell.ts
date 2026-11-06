import { DecimalPipe } from '@angular/common';
import { Component, OnDestroy, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PUBLICATION, money, publicationTotal } from '../core/catalog';
import { DataService } from '../core/data.service';
import { Category } from '../core/models';

@Component({
  imports: [FormsModule, DecimalPipe],
  template: `
    <section class="page">
      <h1 class="title">Armá tu puesto</h1>
      <p class="demo-note"><b>Demostración:</b> la publicación no se guarda ni aparece en el catálogo, y las fotos no salen de tu navegador.</p>
      <form class="checkout" (submit)="publish($event)" novalidate>
        <div class="checkout-fields">
          <label>Nombre <input name="name" [(ngModel)]="name" [class.bad]="tried() && !name.trim()" /></label>
          @if (tried() && !name.trim()) { <p class="err">Poné un nombre.</p> }
          <label>Descripción <textarea name="description" rows="3" [(ngModel)]="description"></textarea></label>
          <label>Categoría
            <select name="category" [(ngModel)]="category" [class.bad]="tried() && !category">
              <option value="">Elegí la categoría…</option>
              @for (c of categories(); track c.id) { <option [value]="c.name">{{ c.name }}</option> }
            </select>
          </label>
          @if (tried() && !category) { <p class="err">Elegí una categoría.</p> }
          <div class="row">
            <label>Costo <input type="number" min="0" name="cost" [ngModel]="cost()" (ngModelChange)="cost.set(+$event || 0)" [class.bad]="tried() && cost() <= 0" /></label>
            <label>Moneda <select name="currency" [ngModel]="currency()" (ngModelChange)="currency.set($event)"><option value="UYU">Pesos (UYU)</option><option value="USD">Dólares (USD)</option></select></label>
            <label>Stock <input type="number" min="1" name="stock" [(ngModel)]="stock" /></label>
          </div>
          @if (tried() && cost() <= 0) { <p class="err">El costo tiene que ser mayor a 0.</p> }
          <fieldset><legend>Tipo de publicación</legend>
            @for (t of types; track t.id) {
              <label class="pick"><input type="radio" name="type" [value]="t.rate" [ngModel]="rate()" (ngModelChange)="rate.set($event)" /> {{ t.label }} ({{ t.rate * 100 | number: '1.0-0' }}%)</label>
            }
          </fieldset>
          <label class="drop" [class.over]="over()" (dragover)="$event.preventDefault(); over.set(true)" (dragleave)="over.set(false)" (drop)="drop($event)">
            <span>Arrastrá fotos acá o tocá para elegirlas</span>
            <input class="sr" type="file" accept="image/*" multiple (change)="pick($event)" />
          </label>
          @if (previews().length) {
            <div class="previews">@for (src of previews(); track src; let i = $index) {
              <figure><img [src]="src" [alt]="'Foto ' + (i + 1) + ' elegida'" /><button type="button" class="btn-text" (click)="removeImage(i)">Quitar</button></figure>
            }</div>
          }
        </div>
        <aside class="ticket" aria-label="Costos de publicar">
          <p><span>Precio</span><b>{{ currency() }} {{ fmt(cost()) }}</b></p>
          <p><span>Comisión {{ rate() * 100 | number: '1.0-0' }}%</span><b>{{ currency() }} {{ fmt(totals().commission) }}</b></p>
          <p class="ticket-total"><span>Total</span><b>{{ currency() }} {{ fmt(totals().total) }}</b></p>
          <button class="btn btn-big">Simular publicación</button>
          @if (sent()) { <p class="ok" role="status">¡Quedó lindo! Como es una demo, no se publicó de verdad.</p> }
        </aside>
      </form>
    </section>
  `,
})
export class Sell implements OnDestroy {
  private data = inject(DataService);
  readonly types = PUBLICATION;
  readonly fmt = money;
  readonly categories = signal<Category[]>([]);
  readonly cost = signal(0);
  readonly currency = signal<'UYU' | 'USD'>('UYU');
  readonly rate = signal<number>(0.13);
  readonly tried = signal(false);
  readonly sent = signal(false);
  readonly over = signal(false);
  readonly previews = signal<string[]>([]);
  readonly totals = computed(() => publicationTotal(this.cost(), this.rate()));
  name = ''; description = ''; category = ''; stock = 1;

  constructor() { this.data.categories().then((c) => this.categories.set(c)).catch(() => undefined); }
  private addFiles(files: FileList | null) {
    const urls = [...(files ?? [])].filter((f) => f.type.startsWith('image/')).map((f) => URL.createObjectURL(f));
    this.previews.update((p) => [...p, ...urls]);
  }
  pick(e: Event) { this.addFiles((e.target as HTMLInputElement).files); }
  drop(e: DragEvent) { e.preventDefault(); this.over.set(false); this.addFiles(e.dataTransfer?.files ?? null); }
  removeImage(i: number) {
    URL.revokeObjectURL(this.previews()[i]);
    this.previews.update((p) => p.filter((_, j) => j !== i));
  }
  valid = () => !!(this.name.trim() && this.category && this.cost() > 0);
  publish(e: Event) {
    e.preventDefault();
    this.tried.set(true);
    this.sent.set(this.valid());
  }
  ngOnDestroy() { this.previews().forEach((u) => URL.revokeObjectURL(u)); }
}
