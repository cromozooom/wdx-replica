import { Injectable } from "@angular/core";
import { GridRow } from "../models/grid-row.interface";

/**
 * Service for generating mock grid data for demonstration purposes.
 * Produces deterministic test data with all required fields populated.
 */
@Injectable({
  providedIn: "root",
})
export class MockDataService {
  private readonly statusValues = [
    "Active",
    "Pending",
    "Inactive",
    "Suspended",
    "Archived",
    "lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua",
  ];
  private readonly departments = [
    "Engineering",
    "Sales",
    "Marketing",
    "Support",
    "Finance",
    "HR",
    "Operations",
  ];
  private readonly locations = [
    "New York",
    "San Francisco",
    "London",
    "Tokyo",
    "Berlin",
    "Sydney",
    "Toronto",
  ];
  private readonly roles = [
    "Developer",
    "Manager",
    "Designer",
    "Analyst",
    "Engineer",
    "Consultant",
    "Specialist",
  ];
  private readonly performances = [
    "Excellent",
    "Good",
    "Average",
    "Needs Improvement",
    "Outstanding",
  ];
  private readonly certifications = [
    "Certified",
    "Not Certified",
    "In Progress",
    "Expired",
    "Advanced",
  ];
  private readonly teams = [
    "Platform",
    "Frontend",
    "Backend",
    "DevOps",
    "QA",
    "Security",
    "Data",
  ];

  /**
   * Generate an array of GridRow objects with simulated data.
   * Each row has a unique ID and all fields populated with deterministic values.
   *
   * @param rowCount - Number of rows to generate (must be positive integer)
   * @returns Array of exactly rowCount GridRow objects
   */
  generate(rowCount: number): GridRow[] {
    if (rowCount < 1 || !Number.isInteger(rowCount)) {
      throw new Error("rowCount must be a positive integer");
    }

    const rows: GridRow[] = [];

    for (let i = 1; i <= rowCount; i++) {
      rows.push({
        id: i,
        name: this.generateName(i),
        email: this.generateEmail(i),
        status: this.selectValue(this.statusValues, i),
        statusAgGrid: this.selectValue(this.statusValues, i),
        department: this.selectValue(this.departments, i),
        location: this.selectValue(this.locations, i),
        role: this.selectValue(this.roles, i),
        startDate: this.generateStartDate(i),
        salary: this.generateSalary(i),
        performance: this.selectValue(this.performances, i),
        projects: this.generateProjects(i),
        hoursLogged: this.generateHoursLogged(i),
        certification: this.selectValue(this.certifications, i),
        experience: this.generateExperience(i),
        team: this.selectValue(this.teams, i),
      });
    }

    return rows;
  }

  /**
   * Generate a deterministic name based on row index.
   */
  private generateName(index: number): string {
    const firstNames = [
      "James",
      "Mary",
      "John",
      "Patricia",
      "Robert",
      "Jennifer",
      "Michael",
      "Linda",
      "William",
      "Elizabeth",
      "Meno Sbastiano Argenti Meno Sbastiano Argenti ",
    ];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
      "Miller",
      "Davis",
      "Rodriguez",
      "Martinez",
    ];

    const firstName = firstNames[index % firstNames.length];
    const lastName =
      lastNames[Math.floor(index / firstNames.length) % lastNames.length];

    return `${firstName} ${lastName}`;
  }

  /**
   * Generate a deterministic email based on row index.
   */
  private generateEmail(index: number): string {
    return `user${index}@example.com`;
  }

  /**
   * Select a value from an array in a deterministic, rotating manner.
   */
  private selectValue<T>(array: T[], index: number): T {
    return array[index % array.length];
  }

  /**
   * Generate a deterministic start date.
   */
  private generateStartDate(index: number): string {
    const year = 2020 + (index % 5);
    const month = (index % 12) + 1;
    const day = (index % 28) + 1;

    return `${year}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
  }

  /**
   * Generate a deterministic salary value.
   */
  private generateSalary(index: number): number {
    const baselineSalary = 50000;
    const variance = (index % 10) * 10000;
    return baselineSalary + variance;
  }

  /**
   * Generate a deterministic project count.
   */
  private generateProjects(index: number): number {
    return (index % 8) + 1;
  }

  /**
   * Generate deterministic hours logged.
   */
  private generateHoursLogged(index: number): number {
    return 120 + (index % 80);
  }

  /**
   * Generate deterministic years of experience.
   */
  private generateExperience(index: number): number {
    return (index % 15) + 1;
  }
}
