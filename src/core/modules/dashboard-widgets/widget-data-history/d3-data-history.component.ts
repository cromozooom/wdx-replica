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
import { FormsModule } from "@angular/forms";

@Component({
  selector: "app-d3-data-history",
  standalone: true,
  imports: [FormsModule],
  templateUrl: "./d3-data-history.component.html",
  styleUrls: ["./d3-data-history.component.scss"],
})
export class D3DataHistoryComponent {
  onToggleInactiveHours() {
    this.render();
  }
  hideInactiveHours = true;
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

  fitToScreen() {
    console.log("fit to screen");
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
    // Dynamic hour stretching: expand hours with overlapping events
    const timestamps = Array.from(
      new Set(this.data.map((d) => d.timestamp))
    ).sort();
    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));
    // 1. Group events by hour
    const hourFormat = d3.timeFormat("%Y-%m-%d %H:00");
    const hourParse = d3.timeParse("%Y-%m-%d %H:00");
    const hourMap = new Map<string, any[]>();
    for (const d of this.data) {
      const hour = hourFormat(new Date(d.timestamp));
      if (!hourMap.has(hour)) hourMap.set(hour, []);
      hourMap.get(hour)!.push(d);
    }
    // 2. Build hour list and calculate required width for each hour
    let hours: string[] = [];
    let current = new Date(minDate);
    current.setMinutes(0, 0, 0);
    const end = new Date(maxDate);
    end.setMinutes(0, 0, 0);
    while (current <= end) {
      const hourStr = hourFormat(current);
      if (!this.hideInactiveHours || (hourMap.get(hourStr)?.length ?? 0) > 0) {
        hours.push(hourStr);
      }
      current = new Date(current.getTime() + 60 * 60 * 1000);
    }
    // 3. Calculate width for each hour
    const minHourWidth = 60;
    const minDotGap = 20;
    // For each hour, width = (number of events - 1) * minDotGap + minHourWidth
    const hourWidths: number[] = hours.map((h: string) => {
      const count = hourMap.get(h)?.length || 0;
      if (count <= 1) return minHourWidth;
      return (count - 1) * minDotGap + minHourWidth;
    });
    // 4. Compute x positions for each hour (left edge)
    const hourX: number[] = [];
    let acc = 60; // margin.left
    for (let i = 0; i < hourWidths.length; i++) {
      hourX.push(acc);
      acc += hourWidths[i];
    }
    width = Math.max(800, acc + 120); // margin.right
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
    // Variable-width scale: map timestamp to stretched x position
    // (removed duplicate hourToIndex declaration)
    const hourToIndex = new Map(hours.map((h: string, i: number) => [h, i]));
    function stretchedX(date: Date) {
      const hour = hourFormat(date);
      const idx = hourToIndex.get(hour) ?? 0;
      const hourStart = hourX[idx];
      const hourW = hourWidths[idx];
      // All events in this hour
      const events = hourMap.get(hour) || [];
      if (events.length <= 1) return hourStart + hourW / 2;
      // Group events by timestamp within this hour
      const tsGroups: { [ts: string]: any[] } = {};
      for (const ev of events) {
        const ts = ev.timestamp.toString();
        if (!tsGroups[ts]) tsGroups[ts] = [];
        tsGroups[ts].push(ev);
      }
      // Flatten: for each group, spread horizontally if >1 in group
      let flat: { event: any; offset: number }[] = [];
      let pos = 0;
      for (const ts of Object.keys(tsGroups).sort()) {
        const group = tsGroups[ts];
        if (group.length === 1) {
          flat.push({ event: group[0], offset: pos });
          pos++;
        } else {
          // Spread within group
          const mid = (group.length - 1) / 2;
          for (let j = 0; j < group.length; j++) {
            flat.push({ event: group[j], offset: pos + (j - mid) * 0.7 });
          }
          pos++;
        }
      }
      // Find this event's offset
      const thisIdx = flat.findIndex(
        (f) => f.event.timestamp === date.getTime()
      );
      if (thisIdx === -1) return hourStart + 20;
      return hourStart + 20 + flat[thisIdx].offset * minDotGap;
    }

    // 3. Draw horizontal lines for each author
    // Draw author lines from start to end of timeline
    this.g
      .selectAll("line.author-line")
      .data(authors)
      .enter()
      .append("line")
      .attr("class", "author-line")
      .attr("x1", 0)
      .attr(
        "x2",
        hourX[hourX.length - 1] + hourWidths[hourWidths.length - 1] + 8 // leave a gap before label
      )
      .attr("y1", (d) => yScale(d) as number)
      .attr("y2", (d) => yScale(d) as number)
      .attr("stroke", "#ccc");

    // Draw author names on the y-axis
    this.g
      .selectAll("text.author-label")
      .data(authors)
      .enter()
      .append("text")
      .attr("class", "author-label")
      .attr(
        "x",
        hourX[hourX.length - 1] + hourWidths[hourWidths.length - 1] + 16
      )
      .attr("y", (d) => yScale(d) as number)
      .attr("dominant-baseline", "middle")
      .attr("text-anchor", "start")
      .attr("font-size", 14)
      .attr("fill", "#444")
      .attr("font-weight", "bold")
      .text((d) => d);

    // 6. Draw x-axis (timeline) with hour ticks (YYYY-MM-DD HH:00)
    // Custom axis for variable-width scale
    const axisG = this.g
      .append("g")
      .attr("transform", `translate(0,${margin.top + timelineHeight + 10})`);
    axisG
      .selectAll("line.hour-tick")
      .data(hours)
      .enter()
      .append("line")
      .attr("class", "hour-tick")
      .attr("x1", (h, i) => hourX[i])
      .attr("x2", (h, i) => hourX[i])
      .attr("y1", 0)
      .attr("y2", 8)
      .attr("stroke", "#888");
    axisG
      .selectAll("text.hour-label")
      .data(hours)
      .enter()
      .append("text")
      .attr("class", (h, i) =>
        hourWidths[i] > minHourWidth
          ? "hour-label extended-hour-label"
          : "hour-label"
      )
      .attr("x", (h, i) => hourX[i] + hourWidths[i] / 2)
      .attr("y", 32)
      .attr("text-anchor", "start")
      .attr("font-size", 10)
      .attr(
        "transform",
        (h, i) => `rotate(60,${hourX[i] + hourWidths[i] / 2},32)`
      )
      .text((h) => h);

    // Remove any other axisG or allHours code below (cleanup)
    // 5. Draw events as circles at exact timestamp (x) and author (y)
    // For each hour, group events by timestamp, then for each group, spread horizontally if >1 in group
    // For each hour, sort events by timestamp, and space them equally from left to right
    const eventDots: { event: any; x: number; y: number }[] = [];
    for (let i = 0; i < hours.length; i++) {
      const hour = hours[i];
      const hourStart = hourX[i];
      const hourW = hourWidths[i];
      const events = (hourMap.get(hour) || []).slice();
      if (events.length === 0) continue;
      // Sort events by timestamp ascending
      events.sort((a, b) => a.timestamp - b.timestamp);
      for (let j = 0; j < events.length; j++) {
        eventDots.push({
          event: events[j],
          x: hourStart + 20 + j * minDotGap,
          y: yScale(events[j].actor?.displayName) as number,
        });
      }
    }
    this.g
      .selectAll("circle.event-dot")
      .data(eventDots)
      .enter()
      .append("circle")
      .attr("class", "event-dot")
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", 8)
      .attr("fill", "#1976d2")
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .append("title")
      .text(
        (d) =>
          `${d.event.actor?.displayName}\n${new Date(d.event.timestamp).toLocaleString()}`
      );
  }
}
