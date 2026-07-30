import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { Subscription } from 'rxjs';
import { ThemeService } from '../../providers/theme.service';

/** One full path through every dimension, e.g. ['OM', 'Agent', 'Routed Out']. */
export interface ParallelSetRecord {
  keys: string[];
  value: number;
}

interface Ribbon extends ParallelSetRecord {
  /** Top edge of the band at each axis. */
  tops: number[];
  color: string;
}

/**
 * Parallel sets (categorical alluvial). Unlike a Sankey — which merges every
 * band that shares a node — each record keeps its own ribbon from the first
 * axis to the last, so a band arriving at "Routed Out" can still be traced
 * back to the component it started from.
 */
@Component({
  selector: 'app-parallel-sets',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './parallel-sets.component.html',
  styleUrl: './parallel-sets.component.css',
})
export class ParallelSetsComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  @ViewChild('parsetsContainer', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  /** One entry per unique combination of categories. */
  @Input() records: ParallelSetRecord[] = [];
  /** Axis titles, in order; length must match each record's `keys`. */
  @Input() dimensions: string[] = [];
  /** Optional category order per axis index (unlisted categories follow). */
  @Input() categoryOrder: string[][] = [];
  /** Category colours keyed by name. */
  @Input() colors: Record<string, string> = {};
  /** Which dimension colours the ribbon (0 = the origin axis). */
  @Input() colorDimension = 0;
  @Input() valueLabel = '';

  private themeSub?: Subscription;
  private resizeObserver?: ResizeObserver;
  private lastWidth = 0;
  private lastHeight = 0;

  constructor(public themeService: ThemeService) {}

  ngAfterViewInit(): void {
    this.render();
    this.themeSub = this.themeService.isDarkMode$.subscribe(() =>
      this.render(),
    );
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        const el = this.containerRef.nativeElement;
        if (
          Math.abs(el.clientWidth - this.lastWidth) > 1 ||
          Math.abs(el.clientHeight - this.lastHeight) > 1
        ) {
          this.render();
        }
      });
      this.resizeObserver.observe(this.containerRef.nativeElement);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['records'] && !changes['records'].firstChange) this.render();
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.resizeObserver?.disconnect();
  }

  private color(name: string): string {
    return this.colors[name] ?? '#0070d2';
  }

  /** Ordered categories per axis, with their totals. */
  private buildAxes(): { name: string; total: number }[][] {
    return this.dimensions.map((_, dim) => {
      const totals = new Map<string, number>();
      for (const rec of this.records) {
        const key = rec.keys[dim];
        totals.set(key, (totals.get(key) ?? 0) + rec.value);
      }
      const preferred = (this.categoryOrder[dim] ?? []).filter((c) =>
        totals.has(c),
      );
      const rest = [...totals.keys()]
        .filter((c) => !preferred.includes(c))
        .sort((a, b) => (totals.get(b) ?? 0) - (totals.get(a) ?? 0));
      return [...preferred, ...rest].map((name) => ({
        name,
        total: totals.get(name) ?? 0,
      }));
    });
  }

  /**
   * Rank of a record within its category on `dim`. Records are grouped by the
   * downstream dimensions first (then the upstream ones), which is what keeps
   * ribbons from the same origin travelling together.
   */
  private sortKey(
    rec: ParallelSetRecord,
    dim: number,
    categoryNames: string[][],
  ): number[] {
    const dims = this.dimensions.length;
    const parts: number[] = [];
    for (let step = 1; step < dims; step++) {
      const d = (dim + step) % dims;
      parts.push(categoryNames[d].indexOf(rec.keys[d]));
    }
    return parts;
  }

  private render(): void {
    const host = this.containerRef?.nativeElement;
    if (!host) return;

    d3.select(host).selectAll('svg').remove();
    if (!this.records.length || this.dimensions.length < 2) return;

    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width < 60 || height < 60) return;
    this.lastWidth = width;
    this.lastHeight = height;

    const dark = this.themeService.isDarkMode;
    const textColor = dark ? '#e0e6ed' : '#1b1c1d';
    const mutedColor = dark ? '#8899a6' : '#666';

    const dims = this.dimensions.length;
    const axes = this.buildAxes();
    const categoryNames = axes.map((cats) => cats.map((c) => c.name));

    const margin = { top: 22, right: 78, bottom: 6, left: 62 };
    const barWidth = 9;
    const gap = 7;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    if (innerWidth < 40 || innerHeight < 40) return;

    const total = d3.sum(this.records, (r) => r.value);
    const maxGaps = Math.max(...axes.map((cats) => cats.length - 1));
    const scale = (innerHeight - maxGaps * gap) / total;
    if (!Number.isFinite(scale) || scale <= 0) return;

    // Category slots per axis, vertically centred so axes with fewer
    // categories (and therefore fewer gaps) stay aligned with the others.
    const slots: Record<string, { y: number; height: number }>[] = axes.map(
      (cats) => {
        const map: Record<string, { y: number; height: number }> = {};
        const stackHeight = total * scale + (cats.length - 1) * gap;
        let y = margin.top + (innerHeight - stackHeight) / 2;
        for (const cat of cats) {
          const h = cat.total * scale;
          map[cat.name] = { y, height: h };
          y += h + gap;
        }
        return map;
      },
    );

    // Stack the ribbons inside each category slot.
    const cursors: Record<string, number>[] = slots.map((slot) => {
      const c: Record<string, number> = {};
      for (const key of Object.keys(slot)) c[key] = slot[key].y;
      return c;
    });

    const ribbons: Ribbon[] = this.records.map((rec) => ({
      ...rec,
      tops: new Array(dims).fill(0),
      color: this.color(rec.keys[this.colorDimension]),
    }));

    for (let dim = 0; dim < dims; dim++) {
      const ordered = [...ribbons].sort((a, b) => {
        const catDiff =
          categoryNames[dim].indexOf(a.keys[dim]) -
          categoryNames[dim].indexOf(b.keys[dim]);
        if (catDiff !== 0) return catDiff;
        const ka = this.sortKey(a, dim, categoryNames);
        const kb = this.sortKey(b, dim, categoryNames);
        for (let i = 0; i < ka.length; i++) {
          if (ka[i] !== kb[i]) return ka[i] - kb[i];
        }
        return 0;
      });
      for (const rib of ordered) {
        const key = rib.keys[dim];
        rib.tops[dim] = cursors[dim][key];
        cursors[dim][key] += rib.value * scale;
      }
    }

    const axisX = (dim: number) =>
      margin.left +
      (dims === 1 ? 0 : (dim * (innerWidth - barWidth)) / (dims - 1));

    const svg = d3
      .select(host)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('font-family', 'Inter, system-ui, sans-serif');

    // ── Ribbons ────────────────────────────────────────────────────────────
    const band = (
      x0: number,
      x1: number,
      t0: number,
      t1: number,
      h: number,
    ) => {
      const mid = (x0 + x1) / 2;
      return (
        `M${x0},${t0}` +
        `C${mid},${t0} ${mid},${t1} ${x1},${t1}` +
        `L${x1},${t1 + h}` +
        `C${mid},${t1 + h} ${mid},${t0 + h} ${x0},${t0 + h}Z`
      );
    };

    const groups = svg
      .append('g')
      .selectAll('g')
      .data(ribbons)
      .join('g')
      .attr('fill-opacity', 0.45)
      .style('cursor', 'default');

    groups.each((rib, i, nodes) => {
      const g = d3.select(nodes[i]);
      const h = rib.value * scale;
      for (let dim = 0; dim < dims - 1; dim++) {
        g.append('path')
          .attr(
            'd',
            band(
              axisX(dim) + barWidth,
              axisX(dim + 1),
              rib.tops[dim],
              rib.tops[dim + 1],
              h,
            ),
          )
          .attr('fill', rib.color);
      }
      g.append('title').text(
        `${rib.keys.join(' → ')}\n${d3.format(',')(rib.value)}` +
          (this.valueLabel ? ` ${this.valueLabel}` : ''),
      );
    });

    groups
      .on('mouseenter', function () {
        groups.attr('fill-opacity', 0.08);
        d3.select(this).attr('fill-opacity', 0.9);
      })
      .on('mouseleave', () => groups.attr('fill-opacity', 0.45));

    // ── Axis bars, category labels and titles ──────────────────────────────
    axes.forEach((cats, dim) => {
      const x = axisX(dim);
      const isLast = dim === dims - 1;
      const g = svg.append('g');

      g.selectAll('rect')
        .data(cats)
        .join('rect')
        .attr('x', x)
        .attr('y', (c) => slots[dim][c.name].y)
        .attr('width', barWidth)
        .attr('height', (c) => Math.max(1, slots[dim][c.name].height))
        .attr('rx', 2)
        .attr('fill', (c) => this.color(c.name))
        .append('title')
        .text(
          (c) =>
            `${c.name}\n${d3.format(',')(c.total)}` +
            (this.valueLabel ? ` ${this.valueLabel}` : ''),
        );

      g.selectAll('text')
        .data(cats)
        .join('text')
        .attr('x', dim === 0 ? x - 6 : x + barWidth + 6)
        .attr(
          'y',
          (c) => slots[dim][c.name].y + slots[dim][c.name].height / 2 + 3,
        )
        .attr('text-anchor', dim === 0 ? 'end' : 'start')
        .attr('fill', textColor)
        .style('font-size', '9px')
        .style('font-weight', '600')
        .style('pointer-events', 'none')
        .text((c) =>
          slots[dim][c.name].height < 7 && !isLast && dim !== 0 ? '' : c.name,
        );

      let titleX = x + barWidth / 2;
      let titleAnchor: 'start' | 'middle' | 'end' = 'middle';
      if (dim === 0) {
        titleX = 2;
        titleAnchor = 'start';
      } else if (isLast) {
        titleX = width - 2;
        titleAnchor = 'end';
      }

      svg
        .append('text')
        .attr('x', titleX)
        .attr('y', 11)
        .attr('text-anchor', titleAnchor)
        .attr('fill', mutedColor)
        .style('font-size', '9.5px')
        .style('font-weight', '600')
        .style('letter-spacing', '0.04em')
        .style('text-transform', 'uppercase')
        .text(this.dimensions[dim]);
    });
  }
}
