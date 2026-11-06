import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { SHIPPING, UYU_PER_USD, cartTotals, money, round2, toUsd } from '../core/catalog';
import { CartItem } from '../core/models';
import { Reveal } from '../core/motion';

@Component({
  imports: [FormsModule, RouterLink, Reveal],
  template: `
    <section class="page">
      <h1 class="title">Tu bolsa</h1>
      @if (done()) {
        <div class="receipt" role="status">
          <span class="stamp" appReveal="stamp">Demo</span>
          <h2>¡Listo! Compra simulada.</h2>
          <p>Esto es una demostración: no se cobró nada, no se envió ningún dato y nada va a llegar a tu casa.</p>
          <a routerLink="/categorias" class="btn">Seguir mirando</a>
        </div>
      } @else if (!cart.items().length) {
        <div class="empty"><p>La bolsa está vacía.</p><a routerLink="/categorias" class="btn">Ver los puestos</a></div>
      } @else {
        <p class="demo-note"><b>Tienda de demostración.</b> No hay pagos reales: no escribas datos verdaderos de tarjeta o cuenta.</p>
        <ul class="lines">
          @for (i of cart.items(); track i.id) {
            <li>
              <img [src]="i.image" alt="" />
              <div class="line-name"><b>{{ i.name }}</b><small>{{ i.currency }} {{ fmt(i.unitCost) }}</small></div>
              <label>Cantidad <input type="number" min="1" [ngModel]="i.count" (ngModelChange)="cart.setCount(i.id, $event)" [ngModelOptions]="{ standalone: true }" /></label>
              <b class="line-total">USD {{ fmt(lineTotal(i)) }}</b>
              <button type="button" class="btn-text" (click)="cart.remove(i.id)" [attr.aria-label]="'Eliminar ' + i.name">Eliminar</button>
            </li>
          }
        </ul>
        <form class="checkout" (submit)="pay($event)" novalidate>
          <div class="checkout-fields">
            <fieldset><legend>Tipo de envío</legend>
              @for (s of shipping; track s.id) {
                <label class="pick"><input type="radio" name="ship" [value]="s.id" [(ngModel)]="ship" (ngModelChange)="rate.set(rateOf($event))" /> <span><b>{{ s.label }}</b> {{ s.days }} ({{ s.rate * 100 }}%)</span></label>
              }
              @if (tried() && !ship) { <p class="err">Elegí un tipo de envío.</p> }
            </fieldset>
            <fieldset><legend>Dirección de envío</legend>
              <label>Calle <input name="street" autocomplete="street-address" [(ngModel)]="street" /></label>
              @if (tried() && !street.trim()) { <p class="err">Falta la calle.</p> }
              <label>Número <input name="number" [(ngModel)]="number" /></label>
              @if (tried() && !number.trim()) { <p class="err">Falta el número.</p> }
              <label>Esquina <input name="corner" [(ngModel)]="corner" /></label>
              @if (tried() && !corner.trim()) { <p class="err">Falta la esquina.</p> }
            </fieldset>
            <fieldset><legend>Forma de pago (simulada)</legend>
              <label class="pick"><input type="radio" name="method" value="card" [(ngModel)]="method" /> Tarjeta de crédito</label>
              <label class="pick"><input type="radio" name="method" value="bank" [(ngModel)]="method" /> Transferencia bancaria</label>
              @if (method === 'card') {
                <label>Número de tarjeta <input name="card" autocomplete="off" inputmode="numeric" placeholder="Solo de prueba" [(ngModel)]="card" /></label>
                <label>Vencimiento (MM/AA) <input name="exp" autocomplete="off" [(ngModel)]="exp" /></label>
                <label>Código de seguridad <input name="cvv" autocomplete="off" inputmode="numeric" [(ngModel)]="cvv" /></label>
              }
              @if (method === 'bank') {
                <label>Número de cuenta <input name="account" autocomplete="off" placeholder="Solo de prueba" [(ngModel)]="account" /></label>
              }
              @if (tried() && paymentError()) { <p class="err">{{ paymentError() }}</p> }
            </fieldset>
          </div>
          <aside class="ticket" aria-label="Resumen">
            <p><span>Subtotal</span><b>USD {{ fmt(totals().subtotal) }}</b></p>
            <p><span>Envío</span><b>USD {{ fmt(totals().shipping) }}</b></p>
            <p class="ticket-total"><span>Total</span><b>USD {{ fmt(totals().total) }}</b></p>
            <small>Los precios en pesos se pasan a dólares a {{ uyu }} UYU por USD.</small>
            <button class="btn btn-big">Simular compra</button>
          </aside>
        </form>
      }
    </section>
  `,
})
export class Cart {
  readonly cart = inject(CartService);
  readonly shipping = SHIPPING;
  readonly uyu = UYU_PER_USD;
  readonly fmt = money;
  readonly rate = signal(0);
  readonly tried = signal(false);
  readonly done = signal(false);
  readonly totals = computed(() => cartTotals(this.cart.items(), this.rate()));
  ship = ''; street = ''; number = ''; corner = ''; method = ''; card = ''; exp = ''; cvv = ''; account = '';

  rateOf = (id: string) => SHIPPING.find((s) => s.id === id)?.rate ?? 0;
  lineTotal = (i: CartItem) => round2(toUsd(i.unitCost, i.currency) * i.count);
  paymentError() {
    if (!this.method) return 'Elegí una forma de pago.';
    if (this.method === 'card' && !(this.card.trim() && this.exp.trim() && this.cvv.trim())) return 'Completá los datos de la tarjeta.';
    if (this.method === 'bank' && !this.account.trim()) return 'Falta el número de cuenta.';
    return '';
  }
  valid = () => !!(this.ship && this.street.trim() && this.number.trim() && this.corner.trim() && !this.paymentError());
  pay(e: Event) {
    e.preventDefault();
    this.tried.set(true);
    if (!this.valid()) return;
    this.card = this.exp = this.cvv = this.account = '';
    this.cart.clear();
    this.done.set(true);
    window.scrollTo({ top: 0 });
  }
}
