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
  // Store unique fieldDisplayNames and their colors
  private fieldNames: string[] = [];
  private fieldColors: Map<string, string> = new Map();

  // Helper to generate a color palette
  private getColorPalette(n: number): string[] {
    // Use d3.schemeCategory10 or interpolateRainbow for more colors
    if ((d3 as any).schemeCategory10 && n <= 10) {
      return (d3 as any).schemeCategory10.slice(0, n);
    }
    // Otherwise, interpolateRainbow
    return Array.from({ length: n }, (_, i) => d3.interpolateRainbow(i / n));
  }
  hideInitialValues = false;
  private filteredData: any[] = [];

  onHideInitialValues() {
    if (this.hideInitialValues) {
      // Find all fields that have more than one timestamp
      const fieldCounts = new Map<string, number>();
      for (const d of this.data) {
        if (!d.fieldDisplayName) continue;
        fieldCounts.set(
          d.fieldDisplayName,
          (fieldCounts.get(d.fieldDisplayName) || 0) + 1
        );
      }
      const multiFields = new Set(
        Array.from(fieldCounts.entries())
          .filter(([_, count]) => count > 1)
          .map(([field]) => field)
      );
      this.filteredData = this.data.filter((d) =>
        multiFields.has(d.fieldDisplayName)
      );
    } else {
      this.filteredData = this.data;
    }
    this.render();
  }
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
    if (!this.svg || !this.g) return;
    const svgWidth = this.svgRef?.nativeElement?.clientWidth || 800;
    // The timeline content width is the rightmost edge of the last hour plus margin
    // Use the same calculation as in render()
    let acc = 60; // margin.left
    const minHourWidth = 60;
    const minDotGap = 20;
    // Recompute hours and hourWidths to match current view
    const hourFormat = d3.timeFormat("%Y-%m-%d %H:00");
    const hourMap = new Map<string, any[]>();
    for (const d of this.data) {
      const hour = hourFormat(new Date(d.timestamp));
      if (!hourMap.has(hour)) hourMap.set(hour, []);
      hourMap.get(hour)!.push(d);
    }
    let hours: string[] = [];
    if (this.data.length > 0) {
      const timestamps = Array.from(
        new Set(this.data.map((d) => d.timestamp))
      ).sort();
      const minDate = new Date(Math.min(...timestamps));
      const maxDate = new Date(Math.max(...timestamps));
      let current = new Date(minDate);
      current.setMinutes(0, 0, 0);
      const end = new Date(maxDate);
      end.setMinutes(0, 0, 0);
      while (current <= end) {
        const hourStr = hourFormat(current);
        if (
          !this.hideInactiveHours ||
          (hourMap.get(hourStr)?.length ?? 0) > 0
        ) {
          hours.push(hourStr);
        }
        current = new Date(current.getTime() + 60 * 60 * 1000);
      }
    }
    const hourWidths: number[] = hours.map((h: string) => {
      const count = hourMap.get(h)?.length || 0;
      if (count <= 1) return minHourWidth;
      return (count - 1) * minDotGap + minHourWidth;
    });
    for (let i = 0; i < hourWidths.length; i++) {
      acc += hourWidths[i];
    }
    const contentWidth = acc;
    const marginLeft = 60;
    const marginRight = 120;
    const timelineWidth = contentWidth;
    const viewWidth = svgWidth;
    // Center the timeline horizontally
    let tx = 0;
    if (timelineWidth + marginLeft + marginRight < viewWidth) {
      tx = (viewWidth - (timelineWidth + marginLeft + marginRight)) / 2;
    }
    // Reset zoom and pan, then apply translation
    this.svg
      .transition()
      .duration(400)
      .call((this.zoom as any).transform, d3.zoomIdentity.translate(tx, 0));
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
    // Step 3: Assign a y-position for each field label, stacking them vertically on the left, 20px apart
    const labelSpacing = 20;
    const labelPadding = 10;
    // Step 1: Extract all unique fieldDisplayName values from the data
    const allFields = Array.from(
      new Set(
        (this.filteredData && this.filteredData.length > 0
          ? this.filteredData
          : this.data
        )
          .map((d: any) => d.fieldDisplayName)
          .filter(Boolean)
      )
    );
    // allFields now contains all unique fieldDisplayName values

    // Step 2: For each field, determine the earliest timestamp and sort the fields accordingly
    const fieldFirstTimestamps = allFields.map((field) => {
      // Find all events for this field
      const events = (
        this.filteredData && this.filteredData.length > 0
          ? this.filteredData
          : this.data
      ).filter((d: any) => d.fieldDisplayName === field);
      // Find the earliest timestamp
      const firstTimestamp = Math.min(...events.map((e: any) => e.timestamp));
      return { field, firstTimestamp };
    });
    // Sort fields by earliest timestamp (ascending)
    fieldFirstTimestamps.sort((a, b) => a.firstTimestamp - b.firstTimestamp);

    this.fieldNames = allFields;
    const palette = this.getColorPalette(allFields.length);
    this.fieldColors = new Map(allFields.map((f, i) => [f, palette[i]]));
    // ...existing code...
    // ...existing code...
    // 1. For each field, collect event points and prepend a start point 50px left of first hour marker
    // We'll store: Map<fieldName, Array<{x: number, y: number}>>
    const fieldPaths: Map<string, { x: number; y: number }[]> = new Map();
    // Move this block after hours, hourX, margin, timelineHeight are defined
    if (!this.g) return;
    this.g.selectAll("*").remove();
    // Use filteredData if set, otherwise use this.data
    const data =
      this.filteredData && this.filteredData.length > 0
        ? this.filteredData
        : this.data;
    // ...existing code...
    // Calculate number of unique event timestamps (to the second)
    // Always use a large enough width for the SVG, not just the container
    let width = 800;
    const height = this.svgRef?.nativeElement?.clientHeight || 400;
    // Dynamic hour stretching: expand hours with overlapping events
    const timestamps = Array.from(new Set(data.map((d) => d.timestamp))).sort();
    const minDate = new Date(Math.min(...timestamps));
    const maxDate = new Date(Math.max(...timestamps));
    // 1. Group events by hour
    const hourFormat = d3.timeFormat("%Y-%m-%d %H:00");
    const hourParse = d3.timeParse("%Y-%m-%d %H:00");
    const hourMap = new Map<string, any[]>();
    for (const d of data) {
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
      .attr("stroke", "var(--bs-gray-300)");

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
      .attr("fill", "var(--bs-gray-600)")
      .text((d) => d);

    // 6. Draw x-axis (timeline) with hour ticks (YYYY-MM-DD HH:00)
    // Custom axis for variable-width scale
    const axisG = this.g
      .append("g")
      .attr("transform", `translate(0,${margin.top + timelineHeight + 10})`);
    // Draw the main axis line (make it visible)
    if (hours.length > 0) {
      const axisStart = hourX[0];
      const axisEnd =
        hourX[hourX.length - 1] + hourWidths[hourWidths.length - 1];
      axisG
        .append("line")
        .attr("class", "timeline-axis-line")
        .attr("x1", axisStart)
        .attr("x2", axisEnd)
        .attr("y1", 0)
        .attr("y2", 0)
        .attr("stroke", "var(--bs-gray-200)")
        .attr("stroke-width", 2);
    }
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
      // Place label at the start of the hour (aligned with tick)
      .attr("x", (h, i) => hourX[i])
      .attr("y", 32)
      .attr("text-anchor", "start")
      .attr("font-size", 10)
      .attr("transform", (h, i) => `rotate(60,${hourX[i]},32)`)
      .text((h) => h);

    // Remove any other axisG or allHours code below (cleanup)
    // 5. Draw events as circles at exact timestamp (x) and author (y)
    // For each hour, group events by timestamp, then for each group, spread horizontally if >1 in group
    // For each hour, sort events by timestamp, and space them equally from left to right
    // --- FIELD SNAKE PATHS CALCULATION (moved here to fix errors) ---
    let eventDotPositions = new Map();
    if (hours.length > 0 && this.fieldNames.length > 0) {
      // Compute new start point: x = 100px left of first hour, y = vertical center between first and last author
      const firstHourX = hourX[0];
      let startY = margin.top + timelineHeight / 2;
      if (authors.length > 1) {
        const yFirst = yScale(authors[0]);
        const yLast = yScale(authors[authors.length - 1]);
        startY = ((yFirst as number) + (yLast as number)) / 2;
      } else if (authors.length === 1) {
        startY = yScale(authors[0]) as number;
      }
      const startX = firstHourX - 100;
      // Precompute event dot positions for all events, keyed by field and timestamp and actor
      for (let i = 0; i < hours.length; i++) {
        const hour = hours[i];
        const hourStart = hourX[i];
        const events = (hourMap.get(hour) || []).slice();
        // Sort events by timestamp ascending
        events.sort((a, b) => a.timestamp - b.timestamp);
        for (let j = 0; j < events.length; j++) {
          const ev = events[j];
          const field = ev.fieldDisplayName;
          if (!field) continue;
          const actor = ev.actor?.displayName || "";
          const x = hourStart + 20 + j * minDotGap;
          const y = yScale(actor) as number;
          eventDotPositions.set(field + "|" + ev.timestamp + "|" + actor, {
            x,
            y,
          });
        }
      }
      for (const field of this.fieldNames) {
        // Get all events for this field, sorted by timestamp
        const events = this.data
          .filter((d) => d.fieldDisplayName === field)
          .sort((a, b) => a.timestamp - b.timestamp);
        // For each event, get x (timeline) and y (author) from precomputed positions
        let points: { x: number; y: number; ts: number }[] = events.map(
          (ev) => {
            const actor = ev.actor?.displayName || "";
            const pos = eventDotPositions.get(
              field + "|" + ev.timestamp + "|" + actor
            );
            if (!pos) {
              // fallback, should not happen
              // axisY is no longer needed; this fallback should not be used
              return { x: firstHourX, y: startY, ts: ev.timestamp };
            }
            return { x: pos.x, y: pos.y, ts: ev.timestamp };
          }
        );
        // Do NOT sort by x; keep points in timestamp order so the line snakes through all dots
        const pointsNoTs = points.map(({ x, y }) => ({ x, y }));
        // Step 1: start at the timeline axis (bottom) at x = firstHourX, y = axisY
        // Step 2: go directly to first event dot, then through all event dots in order
        if (pointsNoTs.length > 0) {
          const pathPoints = [{ x: startX, y: startY }, ...pointsNoTs];
          fieldPaths.set(field, pathPoints);
        }
      }
    }
    // fieldPaths is now ready for drawing in the next step

    // 2. Draw colored snake lines for each field
    // (draw before event dots)
    if (fieldPaths && fieldPaths.size > 0) {
      // Custom path generator for S-curve connectors with horizontal tangents, no synthetic end point
      function sCurvePath(points: { x: number; y: number }[]) {
        if (points.length < 2) return "";
        let d = `M${points[0].x},${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
          const p0 = points[i - 1];
          const p1 = points[i];
          const dx = (p1.x - p0.x) / 2;
          d += ` C${p0.x + dx},${p0.y} ${p1.x - dx},${p1.y} ${p1.x},${p1.y}`;
        }
        return d;
      }
      for (const [field, points] of fieldPaths.entries()) {
        if (Array.isArray(points) && points.length >= 2) {
          // Main visible line, 1px
          this.g
            .append("path")
            .attr("fill", "none")
            .attr("stroke", this.fieldColors.get(field) || "#888")
            .attr("stroke-width", 1)
            .attr("opacity", 1)
            .attr(
              "class",
              `field-snake-line field-snake-line-${field.replace(/[^a-zA-Z0-9_-]/g, "_")}`
            )
            .attr("d", sCurvePath(points));
          // Transparent duplicate for interaction
          this.g
            .append("path")
            .attr("fill", "none")
            .attr("stroke", "transparent")
            .attr("stroke-width", 16)
            .attr(
              "class",
              `field-snake-line-hit field-snake-line-hit-${field.replace(/[^a-zA-Z0-9_-]/g, "_")}`
            )
            .attr("d", sCurvePath(points))
            .style("cursor", "pointer")
            .on("mouseenter", () => {
              d3.selectAll(
                `.field-snake-line-${field.replace(/[^a-zA-Z0-9_-]/g, "_")}`
              )
                .attr("stroke-width", 6)
                .raise();
            })
            .on("mouseleave", () => {
              d3.selectAll(
                `.field-snake-line-${field.replace(/[^a-zA-Z0-9_-]/g, "_")}`
              ).attr("stroke-width", 1);
            });
        }
      }
    }
    // Build eventDots with size info for start/end, using the same precomputed positions as the line
    const eventDots: {
      event: any;
      x: number;
      y: number;
      r: number;
      field: string;
      isFirst: boolean;
      isLast: boolean;
    }[] = [];
    // For each field, mark first/last event for dot sizing
    const fieldEventMap: Record<string, { idx: number; total: number }> = {};
    for (let i = 0; i < hours.length; i++) {
      const hour = hours[i];
      const events = (hourMap.get(hour) || []).slice();
      // Sort events by timestamp ascending
      events.sort((a, b) => a.timestamp - b.timestamp);
      for (let j = 0; j < events.length; j++) {
        const field = events[j].fieldDisplayName;
        if (!field) continue;
        if (!(field in fieldEventMap)) {
          // Count total events for this field
          const total = this.data.filter(
            (d) => d.fieldDisplayName === field
          ).length;
          fieldEventMap[field] = { idx: 0, total };
        }
        const idx = fieldEventMap[field].idx;
        const total = fieldEventMap[field].total;
        const isFirst = idx === 0;
        const isLast = idx === total - 1;
        const actor = events[j].actor?.displayName || "";
        const pos = eventDotPositions.get(
          field + "|" + events[j].timestamp + "|" + actor
        );
        eventDots.push({
          event: events[j],
          x: pos ? pos.x : 0,
          y: pos ? pos.y : 0,
          r: isFirst || isLast ? 8 : 4,
          field,
          isFirst,
          isLast,
        });
        fieldEventMap[field].idx++;
      }
    }
    // Render dots after lines so they appear on top
    const dotSel = this.g
      .selectAll("circle.event-dot")
      .data(eventDots)
      .enter()
      .append("circle")
      .attr(
        "class",
        (d) => `event-dot event-dot-${d.field.replace(/[^a-zA-Z0-9_-]/g, "_")}`
      )
      .attr("cx", (d) => d.x)
      .attr("cy", (d) => d.y)
      .attr("r", (d) => d.r)
      .attr("fill", (d) => {
        const field = d.field;
        if (field && this.fieldColors.has(field)) {
          return this.fieldColors.get(field) || "#1976d2";
        }
        return "#1976d2";
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .style("cursor", "pointer")
      .on("mouseenter", function (event, d) {
        // Fade all lines and dots except this field
        d3.selectAll(".field-snake-line").attr("opacity", 0.4);
        d3.selectAll(".event-dot").attr("opacity", 0.4);
        d3.selectAll(
          `.field-snake-line-${d.field.replace(/[^a-zA-Z0-9_-]/g, "_")}`
        )
          .attr("opacity", 1)
          .attr("stroke-width", 6)
          .raise();
        d3.selectAll(`.event-dot-${d.field.replace(/[^a-zA-Z0-9_-]/g, "_")}`)
          .attr("opacity", 1)
          .attr("r", (d2) => {
            const dot = d2 as { isFirst: boolean; isLast: boolean };
            return dot.isFirst || dot.isLast ? 10 : 6;
          });
      })
      .on("mouseleave", function (event, d) {
        d3.selectAll(".field-snake-line")
          .attr("opacity", 1)
          .attr("stroke-width", 1);
        d3.selectAll(".event-dot")
          .attr("opacity", 1)
          .attr("r", (d2) => {
            const dot = d2 as { isFirst: boolean; isLast: boolean };
            return dot.isFirst || dot.isLast ? 8 : 4;
          });
      });
    dotSel
      .append("title")
      .text(
        (d) =>
          `${d.event.actor?.displayName}\n${new Date(d.event.timestamp).toLocaleString()}`
      );
  }
}
