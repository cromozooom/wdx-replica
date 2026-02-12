/**
 * Represents a single row of test data in the demonstration grid.
 * Contains all column values including the status dropdown selector field.
 */
export interface GridRow {
  /** Unique row identifier */
  id: number;

  /** Full name (person) */
  name: string;

  /** Email address */
  email: string;

  /** Status value (ng-select column) - must be from StatusOption[] */
  status: string;

  /** Status value (ag-Grid rich select column) - must be from StatusOption[] */
  statusAgGrid: string;

  /** Department name */
  department: string;

  /** Office location */
  location: string;

  /** Job role */
  role: string;

  /** Start date (ISO format) */
  startDate: string;

  /** Salary amount */
  salary: number;

  /** Performance rating */
  performance: string;

  /** Project count */
  projects: number;

  /** Hours logged this month */
  hoursLogged: number;

  /** Certification status */
  certification: string;

  /** Years of experience */
  experience: number;

  /** Team assignment */
  team: string;
}
