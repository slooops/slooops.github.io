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

/** One directed flow between two sectors of the chord. */
export interface ChordFlow {
  source: string;
  target: string;
  value: number;
}

/**
 * Directed chord diagram. Each sector's share of the circumference is
 * proportional to the volume flowing through it, and every ribbon's width is
 * proportional to the flow it carries — unlike a circular force graph, where
 * only the node marker scales.
 */
@Component({
  selector: 'app-chord-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chord-chart.component.html',
  styleUrl: './chord-chart.component.css',
})
export class ChordChartComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  @ViewChild('chordContainer', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  /** Directed flows; duplicated pairs are summed. */
  @Input() flows: ChordFlow[] = [];
  /** Sector colours keyed by name. Falls back to a neutral blue. */
  @Input() colors: Record<string, string> = {};
  /** Explicit sector order around the circle. Unlisted names are appended. */
  @Input() order: string[] = [];
  /** Suffix used in tooltips, e.g. "cases". */
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
    if (changes['flows'] && !changes['flows'].firstChange) this.render();
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.resizeObserver?.disconnect();
  }

  private color(name: string): string {
    return this.colors[name] ?? '#0070d2';
  }

  /** Sector names in draw order, plus the flow matrix indexed by that order. */
  private buildMatrix(): { names: string[]; matrix: number[][] } {
    const totals = new Map<string, number>();
    for (const f of this.flows) {
      totals.set(f.source, (totals.get(f.source) ?? 0) + f.value);
      totals.set(f.target, (totals.get(f.target) ?? 0) + f.value);
    }
    const listed = this.order.filter((n) => totals.has(n));
    const rest = [...totals.keys()]
      .filter((n) => !listed.includes(n))
      .sort((a, b) => a.localeCompare(b));
    const names = [...listed, ...rest];

    const index = new Map(names.map((n, i) => [n, i]));
    const matrix = names.map(() => names.map(() => 0));
    for (const f of this.flows) {
      const i = index.get(f.source);
      const j = index.get(f.target);
      if (i != null && j != null) matrix[i][j] += f.value;
    }
    return { names, matrix };
  }

  private render(): void {
    const host = this.containerRef?.nativeElement;
    if (!host) return;

    d3.select(host).selectAll('svg').remove();
    if (!this.flows.length) return;

    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width < 40 || height < 40) return;
    this.lastWidth = width;
    this.lastHeight = height;

    const { names, matrix } = this.buildMatrix();
    if (names.length < 2) return;

    // Room for the outward labels on either side of the ring.
    const labelSpace = 74;
    const outerRadius = Math.max(
      20,
      Math.min(width, height) / 2 - labelSpace / 2,
    );
    const innerRadius = outerRadius - Math.max(6, outerRadius * 0.06);

    const dark = this.themeService.isDarkMode;
    const textColor = dark ? '#e0e6ed' : '#1b1c1d';

    const chords = d3
      .chordDirected()
      .padAngle(12 / outerRadius)
      .sortSubgroups(d3.descending)(matrix);

    const arc = d3
      .arc<d3.ChordGroup>()
      .innerRadius(innerRadius)
      .outerRadius(outerRadius);
    const ribbon = d3.ribbon<d3.Chord, d3.ChordSubgroup>().radius(innerRadius);

    const svg = d3
      .select(host)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
      .style('font-family', 'Inter, system-ui, sans-serif');

    const total = d3.sum(matrix, (row) => d3.sum(row)) * 2;
    const share = (value: number) =>
      total > 0 ? `${((value / total) * 100).toFixed(1)}% of the ring` : '';

    // ── Ribbons ────────────────────────────────────────────────────────────
    const ribbons = svg
      .append('g')
      .attr('fill-opacity', 0.62)
      .selectAll('path')
      .data(chords)
      .join('path')
      .attr('d', ribbon as any)
      .attr('fill', (d) => this.color(names[d.source.index]))
      .attr('stroke', dark ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.6)')
      .attr('stroke-width', 0.5);

    ribbons
      .append('title')
      .text(
        (d) =>
          `${names[d.source.index]} → ${names[d.target.index]}\n` +
          `${d3.format(',')(d.source.value)}${this.valueLabel ? ' ' + this.valueLabel : ''}`,
      );

    // ── Sectors ────────────────────────────────────────────────────────────
    const groups = svg.append('g').selectAll('g').data(chords.groups).join('g');

    groups
      .append('path')
      .attr('d', arc as any)
      .attr('fill', (d) => this.color(names[d.index]))
      .attr('stroke', dark ? '#0f1923' : '#fff')
      .attr('stroke-width', 1)
      .append('title')
      .text(
        (d) =>
          `${names[d.index]}\n${d3.format(',')(d.value)}` +
          `${this.valueLabel ? ' ' + this.valueLabel : ''} · ${share(d.value)}`,
      );

    groups
      .append('text')
      .attr('dy', '0.35em')
      .attr('transform', (d) => {
        const angle = (d.startAngle + d.endAngle) / 2;
        const rotate = (angle * 180) / Math.PI - 90;
        const flip = angle > Math.PI ? ' rotate(180)' : '';
        return `rotate(${rotate}) translate(${outerRadius + 6},0)${flip}`;
      })
      .attr('text-anchor', (d) =>
        (d.startAngle + d.endAngle) / 2 > Math.PI ? 'end' : 'start',
      )
      .attr('fill', textColor)
      .style('font-size', '9px')
      .style('font-weight', '600')
      .text((d) => names[d.index]);

    // ── Hover emphasis ─────────────────────────────────────────────────────
    groups
      .style('cursor', 'default')
      .on('mouseenter', (_event, g) => {
        ribbons.attr('fill-opacity', (d) =>
          d.source.index === g.index || d.target.index === g.index
            ? 0.85
            : 0.08,
        );
      })
      .on('mouseleave', () => ribbons.attr('fill-opacity', 0.62));
  }
}
