import { Injectable, computed, signal } from '@angular/core';

export interface Profile { firstName: string; secondName: string; firstSurname: string; secondSurname: string; phone: string; email: string; imgProfile: string; }

/** Sesión de demostración: solo guarda el mail en este navegador. La contraseña nunca se guarda. */
@Injectable({ providedIn: 'root' })
export class SessionService {
  readonly email = signal(localStorage.getItem('user') ?? '');
  readonly name = computed(() => this.email().split('@')[0]);
  readonly loggedIn = computed(() => this.email().length > 0);
  readonly googleImage = signal(localStorage.getItem('image') ?? '');

  login(email: string, image = '') {
    localStorage.setItem('user', email);
    this.email.set(email);
    if (image) { localStorage.setItem('image', image); this.googleImage.set(image); }
  }
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('image');
    this.email.set('');
    this.googleImage.set('');
  }
  private key = () => `perfil:${this.email()}`;
  profile(): Profile | null {
    const raw = localStorage.getItem(this.key());
    return raw ? JSON.parse(raw) : null;
  }
  saveProfile(p: Profile) { localStorage.setItem(this.key(), JSON.stringify(p)); }
  avatar = () => this.profile()?.imgProfile || this.googleImage() || 'img/img_perfil.png';
}
