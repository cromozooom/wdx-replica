import {
  Component,
  ChangeDetectionStrategy,
  TemplateRef,
  OnInit,
  AfterViewInit,
  AfterViewChecked,
  ViewChild,
  ElementRef,
  ChangeDetectorRef,
  inject,
} from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { HttpClient } from "@angular/common/http";
import {
  NgbDropdownModule,
  NgbModal,
  NgbModalRef,
} from "@ng-bootstrap/ng-bootstrap";
import { NgSelectModule } from "@ng-select/ng-select";
import {
  CdkDragDrop,
  DragDropModule,
  moveItemInArray,
} from "@angular/cdk/drag-drop";
import * as d3 from "d3";
import {
  DependencyNode,
  DependencyLink,
  DependencyGraph,
} from "./models/dependency-graph.models";
import { FilterPipe } from "./pipes/filter.pipe";

/**
 * SPX Tools - Reusable tools dropdown with modals
 * Provides access to various builder and utility tools
 */
@Component({
  selector: "app-spx-tools",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NgbDropdownModule,
    NgSelectModule,
    DragDropModule,
    FilterPipe,
  ],
  templateUrl: "./spx-tools.component.html",
  styleUrls: ["./spx-tools.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpxToolsComponent implements OnInit, AfterViewChecked {
  @ViewChild("graphContainer", { static: false })
  graphContainer?: ElementRef<HTMLDivElement>;

  // Dependency Inspector state
  allNodes: DependencyNode[] = [];
  allLinks: DependencyLink[] = [];
  filteredGraph: DependencyGraph = { nodes: [], links: [] };

  // Filter options
  entityOptions: { id: string; label: string }[] = [];
  formOptions: { id: string; label: string }[] = [];
  documentOptions: { id: string; label: string }[] = [];
  processOptions: { id: string; label: string }[] = [];
  dashboardOptions: { id: string; label: string }[] = [];

  // Selected filters
  selectedEntities: string[] = [];
  selectedForms: string[] = [];
  selectedDocuments: string[] = [];
  selectedProcesses: string[] = [];
  selectedDashboards: string[] = [];

  // Loading state
  isLoading = true;
  loadError: string | null = null;

  // Sorted lists for drag-drop
  sortedEntities: { id: string; label: string }[] = [];
  sortedForms: { id: string; label: string }[] = [];
  sortedDocuments: { id: string; label: string }[] = [];
  sortedProcesses: { id: string; label: string }[] = [];
  sortedDashboards: { id: string; label: string }[] = [];

  // Selected node for highlighting
  selectedNodeId: string | null = null;

  // D3 simulation
  private simulation: any;
  private svg: any;
  private currentModalRef: NgbModalRef | null = null;
  private needsRender = false;

  constructor(
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
  ) {}

  ngOnInit(): void {
    // Load data from generated JSON file
    this.http
      .get<DependencyGraph>("assets/magic-selector-data/dependency-graph.json")
      .subscribe({
        next: (graph) => {
          this.allNodes = graph.nodes;
          this.allLinks = graph.links;

          // Extract filter options from loaded data
          this.entityOptions = graph.nodes
            .filter((n) => n.type === "entity")
            .map((n) => ({ id: n.id, label: n.name }))
            .sort((a, b) => a.label.localeCompare(b.label));

          this.formOptions = graph.nodes
            .filter((n) => n.type === "form")
            .map((n) => ({ id: n.id, label: n.name }))
            .sort((a, b) => a.label.localeCompare(b.label));

          this.documentOptions = graph.nodes
            .filter((n) => n.type === "document")
            .map((n) => ({ id: n.id, label: n.name }))
            .sort((a, b) => a.label.localeCompare(b.label));

          this.processOptions = graph.nodes
            .filter((n) => n.type === "process")
            .map((n) => ({ id: n.id, label: n.name }))
            .sort((a, b) => a.label.localeCompare(b.label));

          this.dashboardOptions = graph.nodes
            .filter((n) => n.type === "dashboard")
            .map((n) => ({ id: n.id, label: n.name }))
            .sort((a, b) => a.label.localeCompare(b.label));

          this.isLoading = false;
          this.loadError = null;

          // Don't render graph initially - wait for user to select filters
          // this.applyFilters();
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error("Failed to load dependency graph:", err);
          this.loadError = "Failed to load dependency graph data";
          this.isLoading = false;
          this.cdr.markForCheck();
        },
      });
  }

  ngAfterViewChecked(): void {
    // If we need to render and the container is now available, render the graph
    if (this.needsRender && this.graphContainer && this.currentModalRef) {
      this.needsRender = false;
      // Use setTimeout to avoid ExpressionChangedAfterItHasBeenCheckedError
      setTimeout(() => this.renderGraph(), 0);
    }
  }

  /**
   * Check if any filters are active
   */
  hasActiveFilters(): boolean {
    return (
      this.selectedEntities.length > 0 ||
      this.selectedForms.length > 0 ||
      this.selectedDocuments.length > 0 ||
      this.selectedProcesses.length > 0 ||
      this.selectedDashboards.length > 0
    );
  }

  /**
   * Apply filters to the dependency graph
   * Shows selected nodes + all directly connected nodes (impact analysis)
   */
  applyFilters(): void {
    const selectedIds = new Set([
      ...this.selectedEntities,
      ...this.selectedForms,
      ...this.selectedDocuments,
      ...this.selectedProcesses,
      ...this.selectedDashboards,
    ]);

    // If no filters selected, show empty graph with prompt message
    if (selectedIds.size === 0) {
      this.filteredGraph = { nodes: [], links: [] };
      this.updateSortedLists();
      this.renderGraph();
      return;
    }

    // For each selected node, find all connected nodes
    const connectedNodeIds = new Set<string>();

    // Add all selected nodes
    selectedIds.forEach((id) => connectedNodeIds.add(id));

    // Find all nodes connected to selected nodes
    this.allLinks.forEach((link) => {
      const sourceId =
        typeof link.source === "string" ? link.source : link.source.id;
      const targetId =
        typeof link.target === "string" ? link.target : link.target.id;

      // If source is selected, include target
      if (selectedIds.has(sourceId)) {
        connectedNodeIds.add(targetId);
      }

      // If target is selected, include source
      if (selectedIds.has(targetId)) {
        connectedNodeIds.add(sourceId);
      }
    });

    // Filter nodes to show selected + connected
    const filteredNodes = this.allNodes.filter((node) =>
      connectedNodeIds.has(node.id),
    );
    const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));

    // Filter links (only show links where both source and target are visible)
    const filteredLinks = this.allLinks.filter((link) => {
      const sourceId =
        typeof link.source === "string" ? link.source : link.source.id;
      const targetId =
        typeof link.target === "string" ? link.target : link.target.id;
      return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
    });

    this.filteredGraph = {
      nodes: filteredNodes,
      links: filteredLinks,
    };

    // Update sorted lists based on selection
    this.updateSortedLists();

    // Mark that we need to render
    if (this.currentModalRef && this.hasActiveFilters()) {
      this.needsRender = true;
    }

    // Trigger change detection
    this.cdr.markForCheck();
  }

  /**
   * Update sorted lists based on selected items
   */
  updateSortedLists(): void {
    this.sortedEntities = this.entityOptions.filter((opt) =>
      this.selectedEntities.includes(opt.id),
    );
    this.sortedForms = this.formOptions.filter((opt) =>
      this.selectedForms.includes(opt.id),
    );
    this.sortedDocuments = this.documentOptions.filter((opt) =>
      this.selectedDocuments.includes(opt.id),
    );
    this.sortedProcesses = this.processOptions.filter((opt) =>
      this.selectedProcesses.includes(opt.id),
    );
    this.sortedDashboards = this.dashboardOptions.filter((opt) =>
      this.selectedDashboards.includes(opt.id),
    );
  }

  /**
   * Handle drag-drop reordering
   */
  dropEntity(event: CdkDragDrop<{ id: string; label: string }[]>): void {
    moveItemInArray(
      this.sortedEntities,
      event.previousIndex,
      event.currentIndex,
    );
    this.cdr.markForCheck();
  }

  dropForm(event: CdkDragDrop<{ id: string; label: string }[]>): void {
    moveItemInArray(this.sortedForms, event.previousIndex, event.currentIndex);
    this.cdr.markForCheck();
  }

  dropDocument(event: CdkDragDrop<{ id: string; label: string }[]>): void {
    moveItemInArray(
      this.sortedDocuments,
      event.previousIndex,
      event.currentIndex,
    );
    this.cdr.markForCheck();
  }

  dropProcess(event: CdkDragDrop<{ id: string; label: string }[]>): void {
    moveItemInArray(
      this.sortedProcesses,
      event.previousIndex,
      event.currentIndex,
    );
    this.cdr.markForCheck();
  }

  dropDashboard(event: CdkDragDrop<{ id: string; label: string }[]>): void {
    moveItemInArray(
      this.sortedDashboards,
      event.previousIndex,
      event.currentIndex,
    );
    this.cdr.markForCheck();
  }

  /**
   * Render D3 force-directed graph
   */
  renderGraph(): void {
    if (!this.graphContainer) return;

    const container = this.graphContainer.nativeElement;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Clear existing SVG
    d3.select(container).select("svg").remove();

    // Create SVG
    const svg = d3
      .select(container)
      .append("svg")
      .attr("width", width)
      .attr("height", height)
      .attr("viewBox", [0, 0, width, height] as any);

    // Add zoom behavior
    const g = svg.append("g");
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });
    svg.call(zoom as any);

    // Create a copy of the data for the simulation
    const nodes = this.filteredGraph.nodes.map((d) => ({ ...d }));
    const links = this.filteredGraph.links.map((d) => ({ ...d }));

    // Color scale for node types
    const colorScale = d3
      .scaleOrdinal<string>()
      .domain(["entity", "form", "document", "process", "dashboard"])
      .range(["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444"]);

    // Create force simulation
    this.simulation = d3
      .forceSimulation(nodes as any)
      .force(
        "link",
        d3
          .forceLink(links as any)
          .id((d: any) => d.id)
          .distance(100)
          .strength((d: any) => d.strength || 0.5),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40));

    // Create links
    const link = g
      .append("g")
      .selectAll("line")
      .data(links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d: any) => Math.sqrt((d.strength || 0.5) * 3));

    // Create link labels
    const linkLabel = g
      .append("g")
      .selectAll("text")
      .data(links)
      .join("text")
      .attr("font-size", 10)
      .attr("fill", "#666")
      .attr("text-anchor", "middle")
      .text((d: any) => d.relationship);

    // Create nodes
    const node = g
      .append("g")
      .selectAll("circle")
      .data(nodes)
      .join("circle")
      .attr("r", 20)
      .attr("fill", (d: any) => colorScale(d.type))
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("cursor", "pointer")
      .on("click", (event, d: any) => {
        this.selectedNodeId = d.id;
        this.highlightConnectedNodes(d.id);
        this.cdr.markForCheck();
      })
      .call(
        d3
          .drag<any, any>()
          .on("start", (event, d: any) => {
            if (!event.active) this.simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d: any) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d: any) => {
            if (!event.active) this.simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }) as any,
      );

    // Create node labels
    const label = g
      .append("g")
      .selectAll("text")
      .data(nodes)
      .join("text")
      .attr("font-size", 12)
      .attr("font-weight", "bold")
      .attr("fill", "#333")
      .attr("text-anchor", "middle")
      .attr("dy", 35)
      .attr("pointer-events", "none")
      .text((d: any) => d.name);

    // Update positions on each tick
    this.simulation.on("tick", () => {
      link
        .attr("x1", (d: any) => d.source.x)
        .attr("y1", (d: any) => d.source.y)
        .attr("x2", (d: any) => d.target.x)
        .attr("y2", (d: any) => d.target.y);

      linkLabel
        .attr("x", (d: any) => (d.source.x + d.target.x) / 2)
        .attr("y", (d: any) => (d.source.y + d.target.y) / 2);

      node.attr("cx", (d: any) => d.x).attr("cy", (d: any) => d.y);

      label.attr("x", (d: any) => d.x).attr("y", (d: any) => d.y);
    });
  }

  /**
   * Highlight nodes connected to the selected node
   */
  highlightConnectedNodes(nodeId: string): void {
    const connectedIds = new Set<string>([nodeId]);

    // Find all connected nodes
    this.filteredGraph.links.forEach((link) => {
      const sourceId =
        typeof link.source === "string" ? link.source : link.source.id;
      const targetId =
        typeof link.target === "string" ? link.target : link.target.id;

      if (sourceId === nodeId) connectedIds.add(targetId);
      if (targetId === nodeId) connectedIds.add(sourceId);
    });

    // Update visual highlighting
    const container = this.graphContainer?.nativeElement;
    if (!container) return;

    const svg = d3.select(container).select("svg");

    svg
      .selectAll("circle")
      .attr("opacity", (d: any) => (connectedIds.has(d.id) ? 1 : 0.2));

    svg.selectAll("line").attr("opacity", (d: any) => {
      const sourceId = typeof d.source === "string" ? d.source : d.source.id;
      const targetId = typeof d.target === "string" ? d.target : d.target.id;
      return sourceId === nodeId || targetId === nodeId ? 1 : 0.1;
    });
  }

  /**
   * Reset graph highlighting
   */
  resetHighlight(): void {
    this.selectedNodeId = null;
    const container = this.graphContainer?.nativeElement;
    if (!container) return;

    const svg = d3.select(container).select("svg");
    svg.selectAll("circle").attr("opacity", 1);
    svg.selectAll("line").attr("opacity", 0.6);
    this.cdr.markForCheck();
  }

  /**
   * Open Inspector modal in fullscreen
   */
  openInspectorModal(content: TemplateRef<any>): void {
    this.currentModalRef = this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });

    // Render graph after modal is opened
    this.currentModalRef.shown.subscribe(() => {
      if (this.hasActiveFilters()) {
        this.needsRender = true;
        this.cdr.markForCheck();
      }
    });

    // Clear modal ref when closed
    this.currentModalRef.hidden.subscribe(() => {
      this.currentModalRef = null;
      this.needsRender = false;
      if (this.simulation) {
        this.simulation.stop();
      }
    });
  }

  /**
   * Open Import/Export modal in fullscreen
   */
  openImportExportModal(content: TemplateRef<any>): void {
    this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });
  }

  /**
   * Open Query Builder modal in fullscreen
   */
  openQueryBuilderModal(content: TemplateRef<any>): void {
    this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });
  }

  /**
   * Open Form Builder modal in fullscreen
   */
  openFormBuilderModal(content: TemplateRef<any>): void {
    this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });
  }

  /**
   * Open Dashboard Builder modal in fullscreen
   */
  openDashboardBuilderModal(content: TemplateRef<any>): void {
    this.modalService.open(content, {
      size: "xl",
      fullscreen: true,
      centered: true,
    });
  }
}
