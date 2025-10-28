import {
  Component,
  ViewChild,
  ElementRef,
  Input,
  OnChanges,
  AfterViewInit,
  SimpleChanges,
} from '@angular/core';
import * as d3 from 'd3';

export interface BarChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface StackedBarChartDataPoint {
  label: string;
  segments: {
    name: string;
    value: number;
    color?: string;
  }[];
}

interface LegendItem {
  name: string;
  color: string;
  total: number;
}

@Component({
  selector: 'app-bar-chart',
  templateUrl: './bar-chart.component.html',
  styleUrl: './bar-chart.component.css',
})
export class BarChartComponent implements OnChanges, AfterViewInit {
  @ViewChild('barChartContainer', { static: true })
  containerRef!: ElementRef<HTMLDivElement>;

  @Input() data: BarChartDataPoint[] | StackedBarChartDataPoint[] = [];
  @Input() canvasId: string = 'barChart';
  @Input() isLoading: boolean = false;
  @Input() stacked: boolean = false;
  @Input() chartWidth: number | string = '100%';
  @Input() chartHeight: number | string = 300;
  @Input() noDataMessage: string = 'No data available';
  @Input() labelRotation: number = -45;
  @Input() showLegend: boolean = true;
  @Input() titleCaseLabels: boolean = true;
  @Input() titleCaseExceptions: string[] = [
    'N/A',
    'NA',
    'IT',
    'API',
    'UI',
    'ID',
    'VT',
    'and',
    'is',
  ];

  private svg: any;
  private container!: HTMLDivElement;
  private actualWidth = 0;
  private actualHeight = 0;
  private readonly margin = { top: 20, right: 50, bottom: 130, left: 20 };
  legendItems: LegendItem[] = [];

  // Color palette
  private readonly defaultColors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#C9CBCF',
  ];

  ngAfterViewInit(): void {
    this.container = this.containerRef.nativeElement;
    this.calculateDimensions();
    if (this.data.length > 0 && !this.isLoading) {
      this.createChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.container && changes['data'] && !changes['data'].firstChange) {
      this.createChart();
    }
    if (
      this.container &&
      changes['isLoading'] &&
      !this.isLoading &&
      this.data.length > 0
    ) {
      this.createChart();
    }
  }

  private calculateDimensions(): void {
    if (typeof this.chartWidth === 'string') {
      this.actualWidth = this.container.clientWidth || 600;
    } else {
      this.actualWidth = this.chartWidth;
    }

    if (typeof this.chartHeight === 'string') {
      this.actualHeight = Number.parseInt(this.chartHeight, 10) || 400;
    } else {
      this.actualHeight = this.chartHeight;
    }
  }

  private toTitleCase(text: string): string {
    if (!this.titleCaseLabels) {
      return text;
    }

    return text
      .split(' ')
      .map((word) => {
        // Check if word is in exceptions array (case-insensitive check)
        const matchingException = this.titleCaseExceptions.find(
          (exception) => exception.toLowerCase() === word.toLowerCase()
        );

        if (matchingException) {
          return matchingException; // Return the exception as defined
        }

        // Otherwise, apply title case
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      })
      .join(' ');
  }

  private createChart(): void {
    if (this.isLoading) return;

    // Clear any existing chart
    d3.select(this.container).selectAll('*').remove();
    this.legendItems = [];

    if (!this.data || this.data.length === 0) {
      this.showNoDataMessage();
      return;
    }

    if (this.stacked) {
      this.createStackedBarChart();
    } else {
      this.createSimpleBarChart();
    }
  }

  private showNoDataMessage(): void {
    const svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.actualWidth)
      .attr('height', this.actualHeight);

    svg
      .append('text')
      .attr('x', this.actualWidth / 2)
      .attr('y', this.actualHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#666')
      .attr('font-size', '16px')
      .text(this.noDataMessage);
  }

  private createSimpleBarChart(): void {
    const data = this.data as BarChartDataPoint[];

    // Create SVG
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.actualWidth)
      .attr('height', this.actualHeight);

    const width = this.actualWidth - this.margin.left - this.margin.right;
    const height = this.actualHeight - this.margin.top - this.margin.bottom;

    const g = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Scales
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, width])
      .padding(0.2);

    const y = d3
      .scaleLinear()
      .domain([0, d3.max(data, (d) => d.value) || 0])
      .nice()
      .range([height, 0]);

    // X-axis (labels only, subtle baseline)
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0));

    // Style the axis line to be subtle
    xAxis.select('.domain').attr('stroke', '#e0e0e0').attr('stroke-width', 1);

    // Rotate labels to descend to the right (anchor at start of text)
    xAxis
      .selectAll('text')
      .text((d: string) => this.toTitleCase(d))
      .attr('transform', `rotate(${-this.labelRotation})`)
      .style('text-anchor', 'start')
      .attr('dx', '.5em')
      .attr('dy', '.5em');

    // Bars
    const tooltip = d3
      .select(this.container)
      .append('div')
      .attr('class', 'bar-tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', '#222')
      .style('color', '#fff')
      .style('padding', '4px 8px')
      .style('font-size', '11px')
      .style('border-radius', '4px')
      .style('opacity', 0);

    g.selectAll('.bar')
      .data(data)
      .enter()
      .append('rect')
      .attr('class', 'bar')
      .attr('x', (d) => x(d.label) || 0)
      .attr('y', (d) => y(d.value))
      .attr('width', x.bandwidth())
      .attr('height', (d) => height - y(d.value))
      .attr(
        'fill',
        (d, i) => d.color || this.defaultColors[i % this.defaultColors.length]
      )
      .on('mouseover', (event: MouseEvent, d) => {
        tooltip
          .style('opacity', 0.95)
          .html(
            `<strong>${this.toTitleCase(d.label)}</strong><br/>Count: ${
              d.value
            }`
          );
      })
      .on('mousemove', (event: MouseEvent) => {
        tooltip
          .style('left', event.offsetX + 15 + 'px')
          .style('top', event.offsetY - 25 + 'px');
      })
      .on('mouseout', () => {
        tooltip.style('opacity', 0);
      })
      .on('click', (event, d) => {
        console.log('Bar clicked:', d);
      });

    // Value labels
    g.selectAll('.label')
      .data(data)
      .enter()
      .append('text')
      .attr('class', 'label')
      .attr('x', (d) => (x(d.label) || 0) + x.bandwidth() / 2)
      .attr('y', (d) => y(d.value) - 5)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('fill', '#333')
      .text((d) => d.value);
  }

  private createStackedBarChart(): void {
    let data = [...(this.data as StackedBarChartDataPoint[])];

    console.log('chart data', data);

    // Ensure labels are in ascending alphabetical order (A-Z) regardless of input order
    data.sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: 'base' })
    );

    // Extract unique segment names for legend and calculate totals
    const segmentNames = new Set<string>();
    const colorMap = new Map<string, string>();
    const totalMap = new Map<string, number>();

    data.forEach((d) => {
      d.segments.forEach((segment) => {
        segmentNames.add(segment.name);
        if (segment.color && !colorMap.has(segment.name)) {
          colorMap.set(segment.name, segment.color);
        }
        // Sum up totals for each segment name
        const currentTotal = totalMap.get(segment.name) || 0;
        totalMap.set(segment.name, currentTotal + segment.value);
      });
    });

    // Build legend items with totals
    const rawLegend = Array.from(segmentNames).map((name, index) => ({
      name,
      color:
        colorMap.get(name) ||
        this.defaultColors[index % this.defaultColors.length],
      total: totalMap.get(name) || 0,
    }));

    // Desired consistent order for match status legend (Title Case)
    const STATUS_ORDER = ['Analyzed', 'Not Matched', 'Matched'];
    this.legendItems = rawLegend
      .sort((a, b) => {
        const ai = STATUS_ORDER.indexOf(this.toTitleCase(a.name));
        const bi = STATUS_ORDER.indexOf(this.toTitleCase(b.name));
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
      })
      // Convert legend names to Title Case for display
      .map((item) => ({ ...item, name: this.toTitleCase(item.name) }));

    // Create SVG
    this.svg = d3
      .select(this.container)
      .append('svg')
      .attr('width', this.actualWidth)
      .attr('height', this.actualHeight);

    const width = this.actualWidth - this.margin.left - this.margin.right;
    const height = this.actualHeight - this.margin.top - this.margin.bottom;

    const g = this.svg
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Calculate max value for y scale
    const maxValue =
      d3.max(data, (d) =>
        d.segments.reduce((sum, seg) => sum + seg.value, 0)
      ) || 0;

    // Scales
    const x = d3
      .scaleBand()
      .domain(data.map((d) => d.label))
      .range([0, width])
      .padding(0.2);

    const y = d3.scaleLinear().domain([0, maxValue]).nice().range([height, 0]);

    // X-axis (labels only, subtle baseline)
    const xAxis = g
      .append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).tickSize(0));

    // Style the axis line to be subtle
    xAxis.select('.domain').attr('stroke', '#e0e0e0').attr('stroke-width', 0);

    // Rotate labels to descend to the right (anchor at start of text)
    xAxis
      .selectAll('text')
      .text((d: string) => this.toTitleCase(d))
      .attr('transform', `rotate(${-this.labelRotation})`)
      .style('text-anchor', 'start')
      .style('font-size', '10px')
      .attr('dx', '.5em')
      .attr('dy', '.5em');

    // Create stacked bars
    // Tooltip for stacked bars
    const tooltip = d3
      .select(this.container)
      .append('div')
      .attr('class', 'bar-tooltip')
      .style('position', 'absolute')
      .style('pointer-events', 'none')
      .style('background', '#222')
      .style('color', '#fff')
      .style('padding', '4px 8px')
      .style('font-size', '11px')
      .style('border-radius', '4px')
      .style('opacity', 0);

    data.forEach((item) => {
      let yOffset = 0;
      const xPos = x(item.label) || 0;
      const barWidth = x.bandwidth();

      item.segments.forEach((segment) => {
        // Use y-scale for both position and height calculations
        const yTop = y(yOffset + segment.value);
        const yBottom = y(yOffset);
        const segmentHeight = yBottom - yTop;

        // Draw segment
        const segmentRect = g
          .append('rect')
          .attr('x', xPos)
          .attr('y', yTop)
          .attr('width', barWidth)
          .attr('height', segmentHeight)
          .attr(
            'fill',
            segment.color ||
              this.legendItems.find(
                (l) => l.name === this.toTitleCase(segment.name)
              )?.color ||
              '#ccc'
          )
          .on('click', () => {
            console.log('Segment clicked:', { label: item.label, segment });
          })
          .on('mouseover', (event: MouseEvent) => {
            tooltip
              .style('opacity', 0.95)
              .html(
                `<strong>${this.toTitleCase(
                  item.label
                )}</strong><br/>${this.toTitleCase(segment.name)}: ${
                  segment.value
                }`
              );
          })
          .on('mousemove', (event: MouseEvent) => {
            tooltip
              .style('left', event.offsetX + 15 + 'px')
              .style('top', event.offsetY - 25 + 'px');
          })
          .on('mouseout', () => tooltip.style('opacity', 0));
        // Keep native title tooltip as fallback
        segmentRect.append('title').text(`${segment.name}: ${segment.value}`);

        // (Removed per requirement: no segment counts inside the bar)

        yOffset += segment.value;
      });

      // Add total value on top (always show, regardless of segment count)
      const totalValue = item.segments.reduce((sum, seg) => sum + seg.value, 0);
      const totalLabel = g
        .append('text')
        .attr('x', xPos + barWidth / 2)
        .attr('y', y(totalValue) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '11px')
        .attr('fill', '#333')
        .attr('font-weight', 'bold')
        .text(totalValue);

      // Removed full-bar overlay tooltip; segment-level hover now provides individual counts only.
    });
  }
}
