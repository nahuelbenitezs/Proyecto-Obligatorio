import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Profile, SessionService } from '../core/session.service';

@Component({
  imports: [FormsModule],
  template: `
    <section class="page">
      <h1 class="title">Mi perfil</h1>
      <form class="profile" (submit)="save($event)" novalidate>
        <div class="avatar"><img [src]="image() || session.avatar()" alt="Tu foto de perfil" />
          <label class="btn btn-small">Cambiar foto <input class="sr" type="file" accept="image/*" (change)="pick($event)" /></label>
        </div>
        <div class="fields">
          <label>Primer nombre * <input name="firstName" autocomplete="given-name" [(ngModel)]="f.firstName" /></label>
          <label>Segundo nombre <input name="secondName" [(ngModel)]="f.secondName" /></label>
          <label>Primer apellido * <input name="firstSurname" autocomplete="family-name" [(ngModel)]="f.firstSurname" /></label>
          <label>Segundo apellido <input name="secondSurname" [(ngModel)]="f.secondSurname" /></label>
          <label>Email * <input name="email" type="email" readonly [ngModel]="session.email()" /></label>
          <label>Teléfono <input name="phone" type="tel" autocomplete="tel" [(ngModel)]="f.phone" /></label>
          @if (error()) { <p class="err" role="alert">{{ error() }}</p> }
          <button class="btn">Guardar cambios</button>
          @if (saved()) { <p class="ok" role="status">Guardado en este navegador.</p> }
        </div>
      </form>
    </section>
  `,
})
export class ProfilePage {
  readonly session = inject(SessionService);
  readonly image = signal('');
  readonly saved = signal(false);
  readonly error = signal('');
  f: Profile = this.session.profile() ?? { firstName: '', secondName: '', firstSurname: '', secondSurname: '', phone: '', email: '', imgProfile: '' };

  pick(e: Event) {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => this.image.set(String(reader.result));
    reader.readAsDataURL(file);
  }
  save(e: Event) {
    e.preventDefault();
    this.saved.set(false);
    if (!this.f.firstName.trim() || !this.f.firstSurname.trim()) { this.error.set('Completá tu primer nombre y tu primer apellido.'); return; }
    try {
      this.session.saveProfile({ ...this.f, email: this.session.email(), imgProfile: this.image() || this.f.imgProfile });
      this.error.set('');
      this.saved.set(true);
    } catch {
      this.error.set('La foto es muy pesada para guardarla en el navegador. Probá con una más chica.');
    }
  }
}
