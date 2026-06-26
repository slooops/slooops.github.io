import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Input,
  ViewChild,
  ElementRef,
} from '@angular/core';

export type LoadingAnimationStyle = 'default' | 'wave' | 'origins' | 'build';

@Component({
  selector: 'app-loading-symbol',
  templateUrl: './loading-symbol.component.html',
  styleUrls: ['./loading-symbol.component.css'],
  standalone: true,
  host: { 'data-component': 'loading-symbol' },
})
export class LoadingSymbolComponent
  implements OnInit, OnDestroy, AfterViewInit
{
  @Input() animationStyle: LoadingAnimationStyle = 'default';
  @ViewChild('animatedSvg') animatedSvg?: ElementRef<SVGSVGElement>;

  private raf: number | null = null;
  private t0 = 0;

  /** Geometry per bar: dot (collapsed) and full-bar (expanded) states. */
  private readonly bars = [
    { dotY: 35.62, dotH: 9.404, fullY: 30.699, fullH: 19.251 },
    { dotY: 29.15, dotH: 9.404, fullY: 17.764, fullH: 32.183 },
    { dotY: 24.99, dotH: 9.404, fullY: 0.074, fullH: 59.238 },
    { dotY: 29.15, dotH: 9.404, fullY: 17.764, fullH: 32.183 },
    { dotY: 35.62, dotH: 9.404, fullY: 30.699, fullH: 19.251 },
    { dotY: 29.15, dotH: 9.404, fullY: 17.764, fullH: 32.183 },
    { dotY: 24.99, dotH: 9.404, fullY: 0.074, fullH: 59.238 },
    { dotY: 29.15, dotH: 9.404, fullY: 17.764, fullH: 32.183 },
    { dotY: 35.62, dotH: 9.404, fullY: 30.699, fullH: 19.251 },
  ];

  constructor() {}

  ngOnInit(): void {}

  ngAfterViewInit(): void {
    if (this.animationStyle === 'default') {
      this.initDefault();
    } else {
      this.t0 = performance.now();
      this.tick();
    }
  }

  ngOnDestroy(): void {
    if (this.raf !== null) {
      cancelAnimationFrame(this.raf);
    }
  }

  /** Set bars to full bridge height and apply CSS color animation. */
  private initDefault(): void {
    const svg = this.animatedSvg?.nativeElement;
    if (!svg) return;
    const rects = svg.querySelectorAll('rect');
    rects.forEach((r, i) => {
      const b = this.bars[i];
      r.setAttribute('y', b.fullY.toFixed(3));
      r.setAttribute('height', b.fullH.toFixed(3));
      r.classList.add('logo__mark-rect');
      r.style.animationDelay = `${(i + 1) * 0.1}s`;
    });
  }

  private easeOut(x: number): number {
    return 1 - Math.pow(1 - x, 3);
  }

  private clamp(x: number): number {
    return Math.max(0, Math.min(1, x));
  }

  private progress(i: number, t: number, style: string, cycle: number): number {
    if (style === 'build') {
      const local = (t / cycle) % 1;
      const stagger = 0.055;
      const grow = 0.32;
      const hold = 0.78;
      let p = this.clamp((local - i * stagger) / grow);
      p = this.easeOut(p);
      if (local > hold) {
        const c = (local - hold) / (1 - hold);
        p = p * (1 - this.easeOut(c));
      }
      return p;
    }
    // wave
    const phase = t / cycle - i * 0.09;
    return 0.5 - 0.5 * Math.cos(phase * 2 * Math.PI);
  }

  private readonly tick = (): void => {
    const svg = this.animatedSvg?.nativeElement;
    if (svg) {
      const t = (performance.now() - this.t0) / 1000;
      const cycle = 1.7;
      const rects = svg.querySelectorAll('rect');
      rects.forEach((r, i) => {
        const b = this.bars[i];
        let p: number;
        let dotY = b.dotY;
        const dotH = b.dotH;

        if (this.animationStyle === 'origins') {
          const ph = t / cycle - i * 0.09;
          p = 0.5 - 0.5 * Math.cos(ph * 2 * Math.PI);
          const fph = ph - Math.floor(ph);
          const n = fph < 0.5 ? Math.floor(ph) : Math.floor(ph) + 1;
          const idx = ((n % 3) + 3) % 3;
          if (idx === 1) dotY = b.fullY;
          else if (idx === 2) dotY = b.fullY + b.fullH - dotH;
          else dotY = b.dotY;
        } else {
          p = this.progress(i, t, this.animationStyle, cycle);
        }

        const y = dotY + (b.fullY - dotY) * p;
        const h = dotH + (b.fullH - dotH) * p;
        r.setAttribute('y', y.toFixed(3));
        r.setAttribute('height', h.toFixed(3));
      });
    }
    this.raf = requestAnimationFrame(this.tick);
  };
}
