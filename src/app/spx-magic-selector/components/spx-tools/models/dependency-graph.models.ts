import { SimulationNodeDatum, SimulationLinkDatum } from "d3";

/**
 * Node types in the dependency graph
 */
export type NodeType = "entity" | "form" | "document" | "process" | "dashboard";

/**
 * Node in the dependency graph
 */
export interface DependencyNode extends SimulationNodeDatum {
  id: string;
  name: string;
  type: NodeType;
  category?: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Link/Edge in the dependency graph
 */
export interface DependencyLink extends SimulationLinkDatum<DependencyNode> {
  source: string | DependencyNode;
  target: string | DependencyNode;
  relationship: string;
  strength?: number;
}

/**
 * Complete dependency graph structure
 */
export interface DependencyGraph {
  nodes: DependencyNode[];
  links: DependencyLink[];
}

/**
 * Filter options for the dependency inspector
 */
export interface DependencyFilter {
  entities: string[];
  forms: string[];
  documents: string[];
  processes: string[];
  dashboards: string[];
}
