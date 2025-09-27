import {
  Component,
  Input,
  ElementRef,
  ViewChild,
  AfterViewInit,
  OnChanges,
  SimpleChanges,
} from "@angular/core";
import * as d3 from "d3";

@Component({
  selector: "app-d3-data-history",
  standalone: true,
  templateUrl: "./d3-data-history.component.html",
  styleUrls: ["./d3-data-history.component.scss"],
})
export class D3DataHistoryComponent {
  @Input() data: any[] = [];
  @ViewChild("d3svg", { static: true }) svgRef!: ElementRef<SVGSVGElement>;

  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null =
    null;
  private g: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private zoom: d3.ZoomBehavior<SVGSVGElement, unknown> | null = null;

  ngAfterViewInit() {
    this.initSvg();
    this.render();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.svg) {
      this.render();
    }
  }

  private initSvg() {
    this.svg = d3.select(this.svgRef.nativeElement);
    if (!this.svg) return;
    this.svg.selectAll("*").remove();
    const width = this.svgRef.nativeElement.clientWidth || 800;
    const height = this.svgRef.nativeElement.clientHeight || 400;
    this.svg
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .style("cursor", "grab");

    this.g = this.svg.append("g");

    this.zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.05, 50]) // allow much deeper zoom in and out
      .on("zoom", (event) => {
        if (this.g) {
          this.g.attr("transform", event.transform);
        }
      });

    this.svg.call(this.zoom as any);
  }

  private render() {
    if (!this.g) return;
    this.g.selectAll("*").remove();
    // Calculate number of unique event timestamps (to the second)
    // Always use a large enough width for the SVG, not just the container
    let width = 800;
    const height = this.svgRef?.nativeElement?.clientHeight || 400;
    // Use a linear scale for exact timestamp placement
    const timestamps = Array.from(
      new Set(this.data.map((d) => d.timestamp))
    ).sort();
    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));
    let hoursCount =
      Math.ceil((maxDate.getTime() - minDate.getTime()) / (60 * 60 * 1000)) + 1;
    width = Math.max(800, 60 * hoursCount + 200);
    if (this.svg) {
      this.svg.attr("width", width).attr("viewBox", `0 0 ${width} ${height}`);
    }
    if (!this.data || this.data.length === 0) return;

    // 1. Get unique authors and dates
    const authors = Array.from(
      new Set(this.data.map((d) => d.actor?.displayName))
    ).filter(Boolean);
    // const timestamps and dates removed (now declared above)

    // 2. Scales
    const margin = { top: 40, right: 120, bottom: 40, left: 60 };
    const timelineWidth = width - margin.left - margin.right;
    const timelineHeight = height - margin.top - margin.bottom;
    const yScale = d3
      .scalePoint()
      .domain(authors)
      .range([margin.top, margin.top + timelineHeight])
      .padding(0.5);
    // Use a linear scale for exact timestamp placement
    const xScale = d3
      .scaleTime()
      .domain([minDate, maxDate])
      .range([margin.left, margin.left + timelineWidth]);

    // 3. Draw horizontal lines for each author
    this.g
      .selectAll("line.author-line")
      .data(authors)
      .enter()
      .append("line")
      .attr("class", "author-line")
      .attr("x1", xScale.range()[0])
      .attr("x2", xScale.range()[1])
      .attr("y1", (d) => yScale(d) as number)
      .attr("y2", (d) => yScale(d) as number)
      .attr("stroke", "#ccc");

    // 4. Draw author names on the right
    this.g
      .selectAll("text.author-label")
      .data(authors)
      .enter()
      .append("text")
      .attr("class", "author-label")
      .attr("x", xScale.range()[1] + 10)
      .attr("y", (d) => (yScale(d) as number) + 5)
      .attr("text-anchor", "start")
      .attr("font-size", 14)
      .attr("fill", "#333")
      .text((d) => d);

    // 5. Draw events as circles at exact timestamp (x) and author (y)
    this.g
      .selectAll("circle.event-dot")
      .data(this.data)
      .enter()
      .append("circle")
      .attr("class", "event-dot")
      .attr("cx", (d) => xScale(new Date(d.timestamp)))
      .attr("cy", (d) => yScale(d.actor?.displayName) as number)
      .attr("r", 8)
      .attr("fill", "#1976d2")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .append("title")
      .text(
        (d) =>
          `${d.actor?.displayName}\n${new Date(d.timestamp).toLocaleString()}`
      );

    // 6. Draw x-axis (timeline) with hour ticks (YYYY-MM-DD HH:00)
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(d3.timeHour.every(1))
      .tickFormat((domainValue, _i) => {
        // domainValue can be Date or NumberValue (object with valueOf)
        let date: Date;
        if (domainValue instanceof Date) {
          date = domainValue;
        } else if (
          typeof domainValue === "object" &&
          "valueOf" in domainValue
        ) {
          date = new Date(Number(domainValue.valueOf()));
        } else {
          date = new Date(domainValue as any);
        }
        return d3.timeFormat("%Y-%m-%d %H:00")(date);
      });
    this.g
      .append("g")
      .attr("transform", `translate(0,${margin.top + timelineHeight + 10})`)
      .call(xAxis as any)
      .selectAll("text")
      .attr("transform", "rotate(60)")
      .style("text-anchor", "start")
      .style("font-size", "10px");
  }
}
