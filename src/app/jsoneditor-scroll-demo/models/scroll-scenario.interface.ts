export interface ScrollScenario {
  id: string;
  label: string;
  description: string;
  containerClass: string;
  editorMode: "code" | "tree";
  sampleData: unknown;
}
