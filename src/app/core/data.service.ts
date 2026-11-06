import { Injectable, signal } from '@angular/core';
import { CartItem, Category, Comment, Product, ProductSummary } from './models';

export const API_BASE = 'https://japceibal.github.io/emercado-api/';

/** Lee la API del curso; si no responde, usa la copia incluida en public/data. */
@Injectable({ providedIn: 'root' })
export class DataService {
  private cache = new Map<string, Promise<unknown>>();
  private pending = signal(0);
  readonly loading = () => this.pending() > 0;
  readonly usingSnapshot = signal(false);

  private get<T>(path: string): Promise<T> {
    let hit = this.cache.get(path) as Promise<T> | undefined;
    if (!hit) {
      hit = this.load<T>(path);
      this.cache.set(path, hit);
      hit.catch(() => this.cache.delete(path));
    }
    return hit;
  }

  private async load<T>(path: string): Promise<T> {
    this.pending.update((n) => n + 1);
    try {
      try {
        return await this.json<T>(API_BASE + path);
      } catch {
        const value = await this.json<T>(new URL('data/' + path, document.baseURI).href);
        this.usingSnapshot.set(true);
        return value;
      }
    } finally {
      this.pending.update((n) => n - 1);
    }
  }

  private async json<T>(url: string): Promise<T> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return res.json();
  }

  categories = () => this.get<Category[]>('cats/cat.json');
  products = (cat: number) =>
    this.get<{ catID: number; catName: string; products: ProductSummary[] }>(`cats_products/${cat}.json`);
  product = (id: number) => this.get<Product>(`products/${id}.json`);
  comments = (id: number) => this.get<Comment[]>(`products_comments/${id}.json`);
  demoCart = () => this.get<{ user: number; articles: CartItem[] }>('user_cart/25801.json');
}
