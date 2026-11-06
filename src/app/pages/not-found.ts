import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  template: `<section class="page"><h1 class="title">Este puesto ya levantó</h1>
    <p>La dirección no existe o cambió.</p><a routerLink="/categorias" class="btn">Ver los puestos</a></section>`,
})
export class NotFound {}
