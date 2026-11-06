import { Injectable, computed, inject, signal } from '@angular/core';
import { DataService } from './data.service';
import { CartItem, Product } from './models';

const KEY = 'carrito';

@Injectable({ providedIn: 'root' })
export class CartService {
  private data = inject(DataService);
  readonly items = signal<CartItem[]>(JSON.parse(localStorage.getItem(KEY) ?? 'null') ?? []);
  readonly count = computed(() => this.items().reduce((n, i) => n + i.count, 0));

  /** Como el sitio original, el primer carrito trae el artículo de ejemplo de la API. */
  async seedDemo() {
    if (localStorage.getItem(KEY) !== null) return;
    const { articles } = await this.data.demoCart();
    if (localStorage.getItem(KEY) === null) this.save([...articles, ...this.items()]);
  }
  add(p: Product) {
    const found = this.items().find((i) => i.id === p.id);
    this.save(found
      ? this.items().map((i) => (i.id === p.id ? { ...i, count: i.count + 1 } : i))
      : [...this.items(), { id: p.id, name: p.name, unitCost: p.cost, currency: p.currency, image: p.images[0], count: 1 }]);
  }
  setCount(id: number, count: number) {
    const safe = Math.max(1, Math.floor(count) || 1);
    this.save(this.items().map((i) => (i.id === id ? { ...i, count: safe } : i)));
  }
  remove(id: number) { this.save(this.items().filter((i) => i.id !== id)); }
  clear() { this.save([]); }
  private save(items: CartItem[]) {
    this.items.set(items);
    localStorage.setItem(KEY, JSON.stringify(items));
  }
}
