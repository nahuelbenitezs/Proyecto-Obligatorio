import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { SessionService } from './core/session.service';

const loggedIn = () => inject(SessionService).loggedIn() || inject(Router).createUrlTree(['/ingresar']);

export const routes: Routes = [
  { path: '', title: 'eMercado — la feria en tu pantalla', loadComponent: () => import('./pages/home').then((m) => m.Home) },
  { path: 'categorias', title: 'Categorías · eMercado', loadComponent: () => import('./pages/categories').then((m) => m.Categories) },
  { path: 'categorias/:id', title: 'Productos · eMercado', loadComponent: () => import('./pages/products').then((m) => m.Products) },
  { path: 'producto/:id', title: 'Producto · eMercado', loadComponent: () => import('./pages/product').then((m) => m.ProductPage) },
  { path: 'carrito', title: 'Tu bolsa · eMercado', loadComponent: () => import('./pages/cart').then((m) => m.Cart) },
  { path: 'vender', title: 'Vender · eMercado', loadComponent: () => import('./pages/sell').then((m) => m.Sell) },
  { path: 'perfil', title: 'Mi perfil · eMercado', canActivate: [loggedIn], loadComponent: () => import('./pages/profile').then((m) => m.ProfilePage) },
  { path: 'ingresar', title: 'Ingresar · eMercado', loadComponent: () => import('./pages/login').then((m) => m.Login) },
  { path: '**', title: 'No encontrado · eMercado', loadComponent: () => import('./pages/not-found').then((m) => m.NotFound) },
];
