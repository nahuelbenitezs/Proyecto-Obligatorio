import { AfterViewInit, Component, ElementRef, NgZone, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SessionService } from '../core/session.service';

const GOOGLE_CLIENT_ID = '493265896825-fmoqnpoj82mdq8ua8b0e9vt510niqlud.apps.googleusercontent.com';

export function decodeJwt(token: string): { email?: string; picture?: string } {
  const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
}

@Component({
  imports: [FormsModule],
  template: `
    <section class="page login">
      <h1 class="title">Pasá nomás</h1>
      <p class="demo-note">Es un ingreso de demostración: alcanza cualquier mail y contraseña inventados. No uses tu contraseña real; no se guarda ni se envía.</p>
      <form (submit)="login($event)" novalidate>
        <label>Email <input name="email" type="email" autocomplete="username" [(ngModel)]="email" [class.bad]="tried() && !email.trim()" /></label>
        @if (tried() && !email.trim()) { <p class="err">Ingresá tu email.</p> }
        <label>Contraseña <input name="password" type="password" autocomplete="off" [(ngModel)]="password" [class.bad]="tried() && !password" /></label>
        @if (tried() && !password) { <p class="err">Ingresá una contraseña.</p> }
        <button class="btn btn-big">Ingresar</button>
      </form>
      <div class="google" #google></div>
    </section>
  `,
})
export class Login implements AfterViewInit {
  private session = inject(SessionService);
  private router = inject(Router);
  private zone = inject(NgZone);
  private google = viewChild.required<ElementRef<HTMLElement>>('google');
  readonly tried = signal(false);
  email = ''; password = '';

  login(e: Event) {
    e.preventDefault();
    this.tried.set(true);
    if (!this.email.trim() || !this.password) return;
    this.session.login(this.email.trim());
    this.password = '';
    this.router.navigateByUrl('/');
  }
  ngAfterViewInit() {
    const s = document.createElement('script');
    s.src = 'https://accounts.google.com/gsi/client';
    s.async = true;
    s.onload = () => {
      const id = (window as any).google?.accounts?.id;
      id?.initialize({ client_id: GOOGLE_CLIENT_ID, callback: (r: { credential: string }) => this.zone.run(() => this.onGoogle(r.credential)) });
      id?.renderButton(this.google().nativeElement, { theme: 'outline', size: 'large', locale: 'es' });
    };
    document.head.append(s);
  }
  onGoogle(token: string) {
    const p = decodeJwt(token);
    if (p.email) { this.session.login(p.email, p.picture); this.router.navigateByUrl('/'); }
  }
}
