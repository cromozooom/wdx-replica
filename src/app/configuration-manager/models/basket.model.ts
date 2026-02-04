export interface Basket {
  id: number;
  name: string;
  color: string; // Hex color code for basket theming
  configurationIds: number[]; // IDs of configurations in this basket
  createdDate: Date;
  createdBy: string;
  lastModifiedDate: Date;
  lastModifiedBy: string;
}

// Color palette for basket assignment
export const BASKET_COLORS = [
  "#0d6efd",
  "#6610f2",
  "#6f42c1",
  "#d63384",
  "#dc3545",
  "#fd7e14",
  "#ffc107",
  "#198754",
  "#0dcaf0",
];

export const CORE_BASKET_COLOR = "#20c997";
