import { Injectable } from "@angular/core";
import {
  DependencyNode,
  DependencyLink,
  DependencyGraph,
} from "../models/dependency-graph.models";

/**
 * Mock data service for dependency graph
 * In production, this would fetch real data from your backend
 */
@Injectable({
  providedIn: "root",
})
export class MockDependencyDataService {
  /**
   * Get all available nodes
   */
  getAllNodes(): DependencyNode[] {
    return [
      // Entities - Client Management (4)
      { id: "e1", name: "Portfolio", type: "entity", category: "Investment" },
      {
        id: "e2",
        name: "Client",
        type: "entity",
        category: "Client Management",
      },
      {
        id: "e3",
        name: "Household",
        type: "entity",
        category: "Client Management",
      },
      {
        id: "e4",
        name: "Beneficiary",
        type: "entity",
        category: "Client Management",
      },

      // Entities - Investment & Trading (4)
      { id: "e5", name: "Account", type: "entity", category: "Investment" },
      { id: "e6", name: "Trade", type: "entity", category: "Trading" },
      {
        id: "e7",
        name: "AssetAllocation",
        type: "entity",
        category: "Investment",
      },
      { id: "e8", name: "Security", type: "entity", category: "Investment" },

      // Entities - Financial Planning (4)
      { id: "e9", name: "FinancialPlan", type: "entity", category: "Planning" },
      {
        id: "e10",
        name: "RetirementPlan",
        type: "entity",
        category: "Planning",
      },
      { id: "e11", name: "TaxPlan", type: "entity", category: "Planning" },
      { id: "e12", name: "EstatePlan", type: "entity", category: "Planning" },

      // Entities - Performance & Reporting (4)
      {
        id: "e13",
        name: "PerformanceReport",
        type: "entity",
        category: "Reporting",
      },
      { id: "e14", name: "Transaction", type: "entity", category: "Reporting" },
      {
        id: "e15",
        name: "FeeStatement",
        type: "entity",
        category: "Reporting",
      },
      { id: "e16", name: "Statement", type: "entity", category: "Reporting" },

      // Entities - Risk & Compliance (4)
      {
        id: "e17",
        name: "RiskProfile",
        type: "entity",
        category: "Compliance",
      },
      {
        id: "e18",
        name: "ComplianceReview",
        type: "entity",
        category: "Compliance",
      },
      {
        id: "e19",
        name: "KYCDocument",
        type: "entity",
        category: "Compliance",
      },
      {
        id: "e20",
        name: "RegulatoryFiling",
        type: "entity",
        category: "Compliance",
      },

      // Entities - Research & Analysis (4)
      { id: "e21", name: "Research", type: "entity", category: "Research" },
      { id: "e22", name: "Analysis", type: "entity", category: "Research" },
      { id: "e23", name: "Product", type: "entity", category: "Research" },
      {
        id: "e24",
        name: "ModelPortfolio",
        type: "entity",
        category: "Research",
      },

      // Forms - Client Management
      {
        id: "f1",
        name: "Portfolio Management Form",
        type: "form",
        category: "Investment",
      },
      { id: "f2", name: "Client Onboarding", type: "form", category: "Client" },
      { id: "f3", name: "Household Setup", type: "form", category: "Client" },
      {
        id: "f4",
        name: "Beneficiary Designation",
        type: "form",
        category: "Client",
      },

      // Forms - Investment & Trading
      {
        id: "f5",
        name: "Account Opening",
        type: "form",
        category: "Investment",
      },
      { id: "f6", name: "Trade Entry", type: "form", category: "Trading" },
      {
        id: "f7",
        name: "Asset Allocation Adjustment",
        type: "form",
        category: "Investment",
      },
      { id: "f8", name: "Security Order", type: "form", category: "Trading" },

      // Forms - Planning
      {
        id: "f9",
        name: "Financial Plan Creation",
        type: "form",
        category: "Planning",
      },
      {
        id: "f10",
        name: "Retirement Plan Setup",
        type: "form",
        category: "Planning",
      },
      {
        id: "f11",
        name: "Tax Planning Form",
        type: "form",
        category: "Planning",
      },
      {
        id: "f12",
        name: "Estate Plan Form",
        type: "form",
        category: "Planning",
      },

      // Documents - Reporting
      {
        id: "d1",
        name: "Performance Report",
        type: "document",
        category: "Reporting",
      },
      {
        id: "d2",
        name: "Transaction Statement",
        type: "document",
        category: "Reporting",
      },
      {
        id: "d3",
        name: "Fee Invoice",
        type: "document",
        category: "Reporting",
      },
      {
        id: "d4",
        name: "Consolidated Statement",
        type: "document",
        category: "Reporting",
      },

      // Documents - Compliance
      {
        id: "d5",
        name: "Risk Assessment",
        type: "document",
        category: "Compliance",
      },
      {
        id: "d6",
        name: "Compliance Certificate",
        type: "document",
        category: "Compliance",
      },
      {
        id: "d7",
        name: "KYC Documentation",
        type: "document",
        category: "Compliance",
      },
      {
        id: "d8",
        name: "Regulatory Filing",
        type: "document",
        category: "Compliance",
      },

      // Documents - Research
      {
        id: "d9",
        name: "Market Research Report",
        type: "document",
        category: "Research",
      },
      {
        id: "d10",
        name: "Portfolio Analysis",
        type: "document",
        category: "Research",
      },
      {
        id: "d11",
        name: "Product Prospectus",
        type: "document",
        category: "Research",
      },
      {
        id: "d12",
        name: "Model Portfolio Guide",
        type: "document",
        category: "Research",
      },

      // Processes
      {
        id: "p1",
        name: "Client Onboarding Flow",
        type: "process",
        category: "Client",
      },
      {
        id: "p2",
        name: "Portfolio Creation Process",
        type: "process",
        category: "Investment",
      },
      {
        id: "p3",
        name: "Trade Execution Flow",
        type: "process",
        category: "Trading",
      },
      {
        id: "p4",
        name: "Financial Planning Workflow",
        type: "process",
        category: "Planning",
      },
      {
        id: "p5",
        name: "Compliance Review Process",
        type: "process",
        category: "Compliance",
      },
      {
        id: "p6",
        name: "Performance Reporting Cycle",
        type: "process",
        category: "Reporting",
      },
      {
        id: "p7",
        name: "Risk Assessment Process",
        type: "process",
        category: "Compliance",
      },
      {
        id: "p8",
        name: "Research Publication Flow",
        type: "process",
        category: "Research",
      },

      // Dashboards
      {
        id: "dash1",
        name: "Portfolio Dashboard",
        type: "dashboard",
        category: "Investment",
      },
      {
        id: "dash2",
        name: "Client Overview",
        type: "dashboard",
        category: "Client",
      },
      {
        id: "dash3",
        name: "Trading Dashboard",
        type: "dashboard",
        category: "Trading",
      },
      {
        id: "dash4",
        name: "Planning Dashboard",
        type: "dashboard",
        category: "Planning",
      },
      {
        id: "dash5",
        name: "Compliance Dashboard",
        type: "dashboard",
        category: "Compliance",
      },
      {
        id: "dash6",
        name: "Performance Dashboard",
        type: "dashboard",
        category: "Reporting",
      },
      {
        id: "dash7",
        name: "Risk Dashboard",
        type: "dashboard",
        category: "Compliance",
      },
      {
        id: "dash8",
        name: "Research Dashboard",
        type: "dashboard",
        category: "Research",
      },
    ];
  }

  /**
   * Get all links between nodes
   */
  getAllLinks(): DependencyLink[] {
    return [
      // Portfolio Dashboard dependencies
      { source: "dash1", target: "e1", relationship: "queries", strength: 1 },
      {
        source: "dash1",
        target: "e7",
        relationship: "displays",
        strength: 0.9,
      },
      { source: "dash1", target: "e13", relationship: "shows", strength: 0.9 },
      {
        source: "dash1",
        target: "d1",
        relationship: "generates",
        strength: 0.8,
      },

      // Client Dashboard dependencies
      { source: "dash2", target: "e2", relationship: "queries", strength: 1 },
      {
        source: "dash2",
        target: "e3",
        relationship: "displays",
        strength: 0.9,
      },
      { source: "dash2", target: "e4", relationship: "shows", strength: 0.7 },

      // Trading Dashboard dependencies
      { source: "dash3", target: "e6", relationship: "queries", strength: 1 },
      {
        source: "dash3",
        target: "e8",
        relationship: "displays",
        strength: 0.9,
      },
      { source: "dash3", target: "d2", relationship: "shows", strength: 0.8 },

      // Planning Dashboard dependencies
      { source: "dash4", target: "e9", relationship: "queries", strength: 1 },
      {
        source: "dash4",
        target: "e10",
        relationship: "displays",
        strength: 0.9,
      },
      { source: "dash4", target: "e11", relationship: "shows", strength: 0.9 },

      // Compliance Dashboard dependencies
      { source: "dash5", target: "e17", relationship: "queries", strength: 1 },
      {
        source: "dash5",
        target: "e18",
        relationship: "displays",
        strength: 0.9,
      },
      { source: "dash5", target: "d6", relationship: "shows", strength: 0.8 },

      // Performance Dashboard dependencies
      { source: "dash6", target: "e13", relationship: "queries", strength: 1 },
      {
        source: "dash6",
        target: "e14",
        relationship: "displays",
        strength: 0.9,
      },
      { source: "dash6", target: "e15", relationship: "shows", strength: 0.9 },

      // Risk Dashboard dependencies
      { source: "dash7", target: "e17", relationship: "queries", strength: 1 },
      {
        source: "dash7",
        target: "e18",
        relationship: "monitors",
        strength: 0.9,
      },

      // Research Dashboard dependencies
      { source: "dash8", target: "e21", relationship: "queries", strength: 1 },
      {
        source: "dash8",
        target: "e22",
        relationship: "displays",
        strength: 0.9,
      },
      { source: "dash8", target: "d9", relationship: "shows", strength: 0.8 },

      // Form to Entity relationships
      { source: "f1", target: "e1", relationship: "creates", strength: 1 },
      { source: "f2", target: "e2", relationship: "creates", strength: 1 },
      { source: "f3", target: "e3", relationship: "creates", strength: 1 },
      { source: "f4", target: "e4", relationship: "creates", strength: 1 },
      { source: "f5", target: "e5", relationship: "creates", strength: 1 },
      { source: "f6", target: "e6", relationship: "creates", strength: 1 },
      { source: "f7", target: "e7", relationship: "updates", strength: 1 },
      { source: "f8", target: "e8", relationship: "orders", strength: 1 },
      { source: "f9", target: "e9", relationship: "creates", strength: 1 },
      { source: "f10", target: "e10", relationship: "creates", strength: 1 },
      { source: "f11", target: "e11", relationship: "creates", strength: 1 },
      { source: "f12", target: "e12", relationship: "creates", strength: 1 },

      // Process to Form relationships
      { source: "p1", target: "f2", relationship: "uses", strength: 1 },
      { source: "p1", target: "f3", relationship: "includes", strength: 0.8 },
      { source: "p2", target: "f1", relationship: "uses", strength: 1 },
      { source: "p2", target: "f5", relationship: "includes", strength: 0.9 },
      { source: "p3", target: "f6", relationship: "uses", strength: 1 },
      { source: "p3", target: "f8", relationship: "executes", strength: 1 },
      { source: "p4", target: "f9", relationship: "uses", strength: 1 },
      { source: "p4", target: "f10", relationship: "includes", strength: 0.9 },
      { source: "p5", target: "e18", relationship: "reviews", strength: 1 },
      { source: "p6", target: "e13", relationship: "generates", strength: 1 },
      { source: "p7", target: "e17", relationship: "assesses", strength: 1 },
      { source: "p8", target: "e21", relationship: "publishes", strength: 1 },

      // Document to Entity relationships
      { source: "d1", target: "e13", relationship: "displays", strength: 1 },
      { source: "d2", target: "e14", relationship: "lists", strength: 1 },
      { source: "d3", target: "e15", relationship: "shows", strength: 1 },
      {
        source: "d4",
        target: "e16",
        relationship: "consolidates",
        strength: 1,
      },
      { source: "d5", target: "e17", relationship: "documents", strength: 1 },
      { source: "d6", target: "e18", relationship: "certifies", strength: 1 },
      { source: "d7", target: "e19", relationship: "contains", strength: 1 },
      { source: "d8", target: "e20", relationship: "files", strength: 1 },
      { source: "d9", target: "e21", relationship: "presents", strength: 1 },
      { source: "d10", target: "e22", relationship: "shows", strength: 1 },
      { source: "d11", target: "e23", relationship: "describes", strength: 1 },
      { source: "d12", target: "e24", relationship: "guides", strength: 1 },

      // Entity to Entity relationships
      { source: "e1", target: "e5", relationship: "contains", strength: 0.9 },
      { source: "e2", target: "e3", relationship: "has", strength: 0.9 },
      { source: "e3", target: "e2", relationship: "belongs_to", strength: 0.9 },
      { source: "e5", target: "e8", relationship: "holds", strength: 0.8 },
      { source: "e6", target: "e8", relationship: "trades", strength: 1 },
      { source: "e7", target: "e1", relationship: "defines", strength: 0.9 },
      {
        source: "e9",
        target: "e2",
        relationship: "created_for",
        strength: 0.9,
      },
      { source: "e10", target: "e9", relationship: "part_of", strength: 0.8 },
      { source: "e11", target: "e9", relationship: "part_of", strength: 0.8 },
      { source: "e12", target: "e9", relationship: "part_of", strength: 0.8 },
      {
        source: "e13",
        target: "e1",
        relationship: "calculated_from",
        strength: 1,
      },
      {
        source: "e14",
        target: "e5",
        relationship: "recorded_in",
        strength: 0.9,
      },
      { source: "e15", target: "e5", relationship: "billed_to", strength: 0.9 },
      {
        source: "e16",
        target: "e5",
        relationship: "summarizes",
        strength: 0.9,
      },
      { source: "e17", target: "e2", relationship: "assesses", strength: 0.9 },
      { source: "e18", target: "e2", relationship: "reviews", strength: 0.8 },
      { source: "e19", target: "e2", relationship: "verifies", strength: 1 },
      {
        source: "e20",
        target: "e5",
        relationship: "reports_on",
        strength: 0.8,
      },
      { source: "e21", target: "e8", relationship: "analyzes", strength: 0.9 },
      { source: "e22", target: "e1", relationship: "evaluates", strength: 0.9 },
      {
        source: "e23",
        target: "e8",
        relationship: "represents",
        strength: 0.8,
      },
      { source: "e24", target: "e7", relationship: "templates", strength: 0.9 },

      // Cross-functional dependencies
      { source: "f1", target: "e2", relationship: "requires", strength: 0.7 },
      { source: "f5", target: "e2", relationship: "requires", strength: 0.9 },
      { source: "f9", target: "e2", relationship: "requires", strength: 1 },
      { source: "f9", target: "e1", relationship: "includes", strength: 0.8 },
      { source: "d1", target: "e1", relationship: "summarizes", strength: 0.9 },
      { source: "d4", target: "e1", relationship: "includes", strength: 0.8 },
      { source: "p6", target: "d1", relationship: "produces", strength: 1 },
      { source: "p5", target: "d6", relationship: "generates", strength: 0.9 },
    ];
  }

  /**
   * Get complete dependency graph
   */
  getDependencyGraph(): DependencyGraph {
    return {
      nodes: this.getAllNodes(),
      links: this.getAllLinks(),
    };
  }

  /**
   * Get unique items for each type (for filters)
   */
  getItemsByType(type: string): { id: string; label: string }[] {
    return this.getAllNodes()
      .filter((node) => node.type === type)
      .map((node) => ({ id: node.id, label: node.name }));
  }
}
