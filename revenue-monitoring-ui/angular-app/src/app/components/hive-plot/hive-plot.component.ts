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

/** A node pinned to one of the plot's axes. */
export interface HiveNode {
  name: string;
  /** Axis index (0-based) the node sits on. */
  axis: number;
  value: number;
}

export interface HiveLink {
  source: string;
  target: string;
  value: number;
}

interface PlacedNode extends HiveNode {
  angle: number;
  radius: number;
  x: number;
  y: number;
}

/**
 * Hive plot: nodes are pinned to radial axes (one per category type) and
 * ordered along them by volume, so edges become readable curves instead of the
 * hairball a force layout produces. Node size and edge width both scale with
 * case volume.
 */
@Component({
  selector: 'app-hive-plot',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './hive-plot.component.html',
  styleUrl: './hive-plot.component.css',
})
export class HivePlotComponent implements AfterViewInit, OnChanges, OnDestroy {
  @HostBinding('class.dark-theme') get darkThemeClass() {
    return this.themeService.isDarkMode;
  }

  @ViewChild('hiveContainer', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  @Input() nodes: HiveNode[] = [];
  @Input() links: HiveLink[] = [];
  /** Axis titles, drawn at the outer end of each axis. */
  @Input() axisLabels: string[] = [];
  @Input() colors: Record<string, string> = {};
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
    const changed = changes['nodes'] || changes['links'];
    if (changed && !changed.firstChange) this.render();
  }

  ngOnDestroy(): void {
    this.themeSub?.unsubscribe();
    this.resizeObserver?.disconnect();
  }

  private color(name: string): string {
    return this.colors[name] ?? '#0070d2';
  }

  /** Sorts each axis by volume (largest nearest the hub) and pins coordinates. */
  private placeNodes(
    axisCount: number,
    innerRadius: number,
    outerRadius: number,
    axisAngle: (axis: number) => number,
  ): Map<string, PlacedNode> {
    const placed = new Map<string, PlacedNode>();
    for (let axis = 0; axis < axisCount; axis++) {
      const onAxis = this.nodes
        .filter((n) => n.axis === axis)
        .sort((a, b) => b.value - a.value);
      const angle = axisAngle(axis);
      const step =
        onAxis.length > 1
          ? (outerRadius - innerRadius) / (onAxis.length - 1)
          : 0;
      onAxis.forEach((node, i) => {
        const radius = innerRadius + i * step;
        placed.set(node.name, {
          ...node,
          angle,
          radius,
          x: radius * Math.cos(angle),
          y: radius * Math.sin(angle),
        });
      });
    }
    return placed;
  }

  private drawAxes(
    group: d3.Selection<SVGGElement, unknown, null, undefined>,
    opts: {
      axisCount: number;
      axisAngle: (axis: number) => number;
      innerRadius: number;
      outerRadius: number;
      axisColor: string;
      mutedColor: string;
    },
  ): void {
    const tipRadius = opts.outerRadius + 8;
    for (let axis = 0; axis < opts.axisCount; axis++) {
      const angle = opts.axisAngle(axis);
      group
        .append('line')
        .attr('x1', opts.innerRadius * Math.cos(angle))
        .attr('y1', opts.innerRadius * Math.sin(angle))
        .attr('x2', tipRadius * Math.cos(angle))
        .attr('y2', tipRadius * Math.sin(angle))
        .attr('stroke', opts.axisColor)
        .attr('stroke-width', 1);

      const label = this.axisLabels[axis];
      if (!label) continue;
      group
        .append('text')
        .attr('x', (tipRadius + 6) * Math.cos(angle))
        .attr('y', (tipRadius + 6) * Math.sin(angle))
        .attr('dy', Math.sin(angle) < -0.5 ? '-0.2em' : '0.8em')
        .attr('text-anchor', 'middle')
        .attr('fill', opts.mutedColor)
        .style('font-size', '9.5px')
        .style('font-weight', '600')
        .style('letter-spacing', '0.04em')
        .style('text-transform', 'uppercase')
        .text(label);
    }
  }

  private render(): void {
    const host = this.containerRef?.nativeElement;
    if (!host) return;

    d3.select(host).selectAll('svg').remove();
    if (!this.nodes.length || !this.links.length) return;

    const width = host.clientWidth;
    const height = host.clientHeight;
    if (width < 60 || height < 60) return;
    this.lastWidth = width;
    this.lastHeight = height;

    const dark = this.themeService.isDarkMode;
    const textColor = dark ? '#e0e6ed' : '#1b1c1d';
    const mutedColor = dark ? '#8899a6' : '#666';
    const axisColor = dark ? 'rgba(136,153,166,0.35)' : 'rgba(0,0,0,0.14)';

    const axisCount = Math.max(...this.nodes.map((n) => n.axis)) + 1;
    const labelSpace = 66;
    const outerRadius = Math.max(
      30,
      Math.min(width, height) / 2 - labelSpace / 2,
    );
    const innerRadius = Math.min(26, outerRadius * 0.3);

    // Axes are evenly spaced, starting at 12 o'clock and going clockwise.
    const axisAngle = (axis: number) =>
      -Math.PI / 2 + (axis * 2 * Math.PI) / axisCount;

    const placed = this.placeNodes(
      axisCount,
      innerRadius,
      outerRadius,
      axisAngle,
    );

    const maxNodeValue = d3.max(this.nodes, (n) => n.value) ?? 1;
    const maxLinkValue = d3.max(this.links, (l) => l.value) ?? 1;
    const nodeRadius = (value: number) =>
      3 + 6 * Math.sqrt(value / maxNodeValue);

    const svg = d3
      .select(host)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [-width / 2, -height / 2, width, height].join(' '))
      .style('font-family', 'Inter, system-ui, sans-serif');

    // ── Axes ───────────────────────────────────────────────────────────────
    this.drawAxes(svg.append('g'), {
      axisCount,
      axisAngle,
      innerRadius,
      outerRadius,
      axisColor,
      mutedColor,
    });

    // ── Links (hive curves: constant radius, angle eased in thirds) ────────
    const point = (radius: number, angle: number) =>
      `${radius * Math.cos(angle)},${radius * Math.sin(angle)}`;

    const linkPath = (a: PlacedNode, b: PlacedNode) => {
      let delta = b.angle - a.angle;
      // Always sweep the short way round the circle.
      while (delta > Math.PI) delta -= 2 * Math.PI;
      while (delta < -Math.PI) delta += 2 * Math.PI;
      const a1 = a.angle + delta / 3;
      const a2 = a.angle + (2 * delta) / 3;
      return (
        `M${point(a.radius, a.angle)}` +
        `C${point(a.radius, a1)} ${point(b.radius, a2)} ${point(b.radius, b.angle)}`
      );
    };

    const resolved = this.links
      .map((link) => ({
        link,
        a: placed.get(link.source),
        b: placed.get(link.target),
      }))
      .filter((d) => d.a && d.b) as {
      link: HiveLink;
      a: PlacedNode;
      b: PlacedNode;
    }[];

    const linkPaths = svg
      .append('g')
      .attr('fill', 'none')
      .selectAll('path')
      .data(resolved)
      .join('path')
      .attr('d', (d) => linkPath(d.a, d.b))
      .attr('stroke', (d) => this.color(d.link.source))
      .attr('stroke-width', (d) =>
        Math.max(0.6, 5 * Math.sqrt(d.link.value / maxLinkValue)),
      )
      .attr('stroke-opacity', 0.35)
      .attr('stroke-linecap', 'round');

    linkPaths
      .append('title')
      .text(
        (d) =>
          `${d.link.source} → ${d.link.target}\n${d3.format(',')(d.link.value)}` +
          (this.valueLabel ? ` ${this.valueLabel}` : ''),
      );

    // ── Nodes ──────────────────────────────────────────────────────────────
    const nodeGroup = svg
      .append('g')
      .selectAll('g')
      .data([...placed.values()])
      .join('g')
      .style('cursor', 'default');

    nodeGroup
      .append('circle')
      .attr('cx', (d) => d.x)
      .attr('cy', (d) => d.y)
      .attr('r', (d) => nodeRadius(d.value))
      .attr('fill', (d) => this.color(d.name))
      .attr('stroke', dark ? '#0f1923' : '#fff')
      .attr('stroke-width', 1.25);

    // Labels fan out perpendicular to their axis so they never collide.
    nodeGroup
      .append('text')
      .attr('transform', (d) => {
        const perp = d.angle + Math.PI / 2;
        const offset = nodeRadius(d.value) + 5;
        const x = d.x + offset * Math.cos(perp);
        const y = d.y + offset * Math.sin(perp);
        const rotate = ((perp * 180) / Math.PI + 360) % 360;
        const flip = rotate > 90 && rotate < 270 ? 180 : 0;
        return `translate(${x},${y}) rotate(${rotate + flip})`;
      })
      .attr('text-anchor', (d) => {
        const rotate = (((d.angle + Math.PI / 2) * 180) / Math.PI + 360) % 360;
        return rotate > 90 && rotate < 270 ? 'end' : 'start';
      })
      .attr('dy', '0.32em')
      .attr('fill', textColor)
      .style('font-size', '8.5px')
      .style('font-weight', '600')
      .style('pointer-events', 'none')
      .text((d) => d.name);

    nodeGroup
      .append('title')
      .text(
        (d) =>
          `${d.name}\n${d3.format(',')(d.value)}` +
          (this.valueLabel ? ` ${this.valueLabel}` : ''),
      );

    nodeGroup
      .on('mouseenter', (_event, node) => {
        linkPaths.attr('stroke-opacity', (d) =>
          d.link.source === node.name || d.link.target === node.name
            ? 0.85
            : 0.05,
        );
      })
      .on('mouseleave', () => linkPaths.attr('stroke-opacity', 0.35));
  }
}
