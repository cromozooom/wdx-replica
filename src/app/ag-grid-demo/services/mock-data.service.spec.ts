import { TestBed } from "@angular/core/testing";
import { MockDataService } from "./mock-data.service";
import { GridRow } from "../models/grid-row.interface";

describe("MockDataService", () => {
  let service: MockDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MockDataService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  describe("generate", () => {
    it("should generate exactly the requested number of rows", () => {
      const rowCount = 50;
      const result = service.generate(rowCount);

      expect(result.length).toBe(rowCount);
    });

    it("should generate 100 rows when requested", () => {
      const result = service.generate(100);

      expect(result.length).toBe(100);
    });

    it("should generate rows with unique sequential IDs", () => {
      const result = service.generate(10);

      result.forEach((row, index) => {
        expect(row.id).toBe(index + 1);
      });
    });

    it("should populate all required fields for each row", () => {
      const result = service.generate(5);

      result.forEach((row: GridRow) => {
        // Check all fields are defined
        expect(row.id).toBeDefined();
        expect(row.name).toBeDefined();
        expect(row.email).toBeDefined();
        expect(row.status).toBeDefined();
        expect(row.department).toBeDefined();
        expect(row.location).toBeDefined();
        expect(row.role).toBeDefined();
        expect(row.startDate).toBeDefined();
        expect(row.salary).toBeDefined();
        expect(row.performance).toBeDefined();
        expect(row.projects).toBeDefined();
        expect(row.hoursLogged).toBeDefined();
        expect(row.certification).toBeDefined();
        expect(row.experience).toBeDefined();
        expect(row.team).toBeDefined();

        // Check no fields are null or undefined
        expect(row.id).not.toBeNull();
        expect(row.name).not.toBeNull();
        expect(row.email).not.toBeNull();
        expect(row.status).not.toBeNull();
      });
    });

    it("should generate valid status values", () => {
      const validStatuses = [
        "Active",
        "Pending",
        "Inactive",
        "Suspended",
        "Archived",
      ];
      const result = service.generate(20);

      result.forEach((row: GridRow) => {
        expect(validStatuses).toContain(row.status);
      });
    });

    it("should generate email addresses in correct format", () => {
      const result = service.generate(10);
      const emailRegex = /^user\d+@example\.com$/;

      result.forEach((row: GridRow) => {
        expect(row.email).toMatch(emailRegex);
      });
    });

    it("should generate valid date strings in ISO format", () => {
      const result = service.generate(10);
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

      result.forEach((row: GridRow) => {
        expect(row.startDate).toMatch(dateRegex);

        // Verify it's a valid date
        const date = new Date(row.startDate);
        expect(date.toString()).not.toBe("Invalid Date");
      });
    });

    it("should generate positive salary values", () => {
      const result = service.generate(10);

      result.forEach((row: GridRow) => {
        expect(row.salary).toBeGreaterThan(0);
        expect(Number.isInteger(row.salary)).toBe(true);
      });
    });

    it("should generate non-negative project counts", () => {
      const result = service.generate(10);

      result.forEach((row: GridRow) => {
        expect(row.projects).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(row.projects)).toBe(true);
      });
    });

    it("should generate non-negative hours logged", () => {
      const result = service.generate(10);

      result.forEach((row: GridRow) => {
        expect(row.hoursLogged).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(row.hoursLogged)).toBe(true);
      });
    });

    it("should generate non-negative experience values", () => {
      const result = service.generate(10);

      result.forEach((row: GridRow) => {
        expect(row.experience).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(row.experience)).toBe(true);
      });
    });

    it("should produce deterministic results (same input = same output)", () => {
      const result1 = service.generate(10);
      const result2 = service.generate(10);

      expect(result1).toEqual(result2);
    });

    it("should throw error when rowCount is not positive", () => {
      expect(() => service.generate(0)).toThrowError(
        "rowCount must be a positive integer",
      );
      expect(() => service.generate(-5)).toThrowError(
        "rowCount must be a positive integer",
      );
    });

    it("should throw error when rowCount is not an integer", () => {
      expect(() => service.generate(5.5)).toThrowError(
        "rowCount must be a positive integer",
      );
    });
  });
});
