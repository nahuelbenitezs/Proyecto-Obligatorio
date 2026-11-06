import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';
import { animate, inView, scroll } from 'motion';

const EASE = [0.16, 1, 0.3, 1] as const;
export const reducedMotion = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches ?? true;

/** Entrada al aparecer en pantalla. Sin JS o con movimiento reducido, el contenido ya está visible. */
@Directive({ selector: '[appReveal]' })
export class Reveal implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  readonly appReveal = input<'wipe' | 'stamp' | 'slide' | ''>('');
  readonly delay = input(0);
  private stop?: () => void;

  ngOnInit() {
    if (reducedMotion() || typeof IntersectionObserver === 'undefined') return;
    const kind = this.appReveal() || 'wipe';
    const from: Record<string, unknown> = kind === 'stamp'
      ? { scale: [1.9, 1], opacity: [0, 1] }
      : kind === 'slide'
        ? { x: [-50, 0], opacity: [0, 1] }
        : { clipPath: ['inset(0 0 100% 0)', 'inset(0 0 0% 0)'] };
    this.stop = inView(this.el, () => {
      animate(this.el, from as never, { duration: kind === 'stamp' ? 0.32 : 0.6, delay: Math.min(this.delay(), 0.3), ease: EASE });
    }, { amount: 0.12 });
  }
  ngOnDestroy() { this.stop?.(); }
}

/** Firma del sitio: los títulos de afiche se ensanchan a medida que bajás. */
@Directive({ selector: '[appStretch]' })
export class Stretch implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private stop?: () => void;
  ngOnInit() {
    if (reducedMotion()) return;
    this.stop = scroll((p: number) => {
      this.el.style.fontStretch = `${62 + 38 * Math.min(1, p * 1.6)}%`;
    }, { target: this.el, offset: ['start end', 'center center'] });
  }
  ngOnDestroy() { this.stop?.(); }
}

/** La foto se desplaza dentro de su marco, atada al scroll. */
@Directive({ selector: '[appDrift]' })
export class Drift implements OnInit, OnDestroy {
  private el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
  private stop?: () => void;
  ngOnInit() {
    if (reducedMotion()) return;
    this.stop = scroll(animate(this.el, { y: ['-7%', '7%'] }, { ease: 'linear' }), {
      target: this.el.parentElement!, offset: ['start end', 'end start'],
    });
  }
  ngOnDestroy() { this.stop?.(); }
}

/** Una copia de la foto vuela hasta la bolsa y la bolsa acusa recibo. */
export async function flyToBag(source: HTMLElement | null) {
  const bag = document.querySelector<HTMLElement>('#bolsa');
  if (!source || !bag || reducedMotion()) return;
  const a = source.getBoundingClientRect();
  const b = bag.getBoundingClientRect();
  const ghost = source.cloneNode(true) as HTMLElement;
  Object.assign(ghost.style, { position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`, zIndex: '100', margin: '0', pointerEvents: 'none', objectFit: 'cover', transformOrigin: 'top left' });
  document.body.append(ghost);
  const flight = animate(ghost, { x: [0, b.left - a.left], y: [0, b.top - a.top], scale: [1, b.width / a.width], rotate: [0, 18] }, { duration: 0.48, ease: [0.5, 0, 0.2, 1] });
  // Con la pestaña oculta la animación no avanza: comprar no puede quedar esperándola.
  await Promise.race([flight.finished, new Promise((r) => setTimeout(r, 700))]);
  ghost.remove();
  animate(bag, { scale: [1.5, 1], rotate: [-12, 0] }, { duration: 0.28, ease: EASE });
}
