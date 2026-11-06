import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Drift, Reveal, Stretch } from '../core/motion';

@Component({
  imports: [RouterLink, Reveal, Stretch, Drift],
  template: `
    <section class="hero">
      <h1>Todo lo de la feria, <em>sin madrugar.</em></h1>
      <div class="hero-side">
        <picture class="hero-gif">
          <source srcset="img/vidriera.jpg" media="(prefers-reduced-motion: reduce)" />
          <img src="img/vidriera.gif" alt="Fotos de autos, juguetes y muebles que cambian como en una vidriera" width="480" height="360" fetchpriority="high" />
        </picture>
        <span class="stamp hero-stamp" appReveal="stamp" aria-hidden="true">¡Es demo!</span>
      </div>
      <a routerLink="/categorias" class="btn btn-big">Ver los puestos</a>
    </section>
    <div class="marquee" aria-hidden="true"><div>
      @for (x of [1, 2, 3, 4]; track x) { <span>Autos ★ Juguetes ★ Muebles ★ Computadoras ★ Pague solo de mentira ★&nbsp;</span> }
    </div></div>
    @for (c of featured; track c.id) {
      <a [class]="'poster poster-' + c.color" [routerLink]="['/categorias', c.id]">
        <h2 appStretch>{{ c.name }}</h2>
        <div class="poster-photo"><img appDrift [src]="c.img" [alt]="'Foto de la categoría ' + c.name" loading="lazy" /></div>
        <p>{{ c.text }}</p>
        <span class="poster-go">Entrar al puesto →</span>
      </a>
    }
    <a routerLink="/categorias" class="more"><span appStretch>¡Y mucho más!</span></a>
  `,
})
export class Home {
  readonly featured = [
    { id: 101, name: 'Autos', color: 'red', img: 'img/cars_index.jpg', text: 'Los mejores precios en autos 0 kilómetro, de alta y media gama.' },
    { id: 102, name: 'Juguetes', color: 'yellow', img: 'img/toys_index.jpg', text: 'Encontrá los mejores precios para niños y niñas de cualquier edad.' },
    { id: 103, name: 'Muebles', color: 'blue', img: 'img/furniture_index.jpg', text: 'Muebles antiguos, nuevos y para armar uno mismo.' },
  ];
}
