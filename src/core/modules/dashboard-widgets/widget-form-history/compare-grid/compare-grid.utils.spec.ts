import { buildCompareRows } from "./compare-grid.utils";

describe("buildCompareRows", () => {
  it("should compare two flat objects and return correct compare rows", () => {
    const prev = { name: null, age: 3 };
    const current = { "full Name": "Razvan Nicu", age: 3, gender: "male" };
    const result = buildCompareRows(prev, current);
    expect(result).toEqual([
      {
        field: "name",
        prevValue: null,
        currentValue: undefined,
        status: "onlyPrev",
      },
      { field: "age", prevValue: 3, currentValue: 3, status: "both" },
      {
        field: "full Name",
        prevValue: undefined,
        currentValue: "Razvan Nicu",
        status: "onlyCurrent",
      },
      {
        field: "gender",
        prevValue: undefined,
        currentValue: "male",
        status: "onlyCurrent",
      },
    ]);
  });

  it("should handle empty objects", () => {
    expect(buildCompareRows({}, {})).toEqual([]);
  });

  it("should handle missing prev or current", () => {
    expect(buildCompareRows(undefined, { foo: 1 })).toEqual([
      {
        field: "foo",
        prevValue: undefined,
        currentValue: 1,
        status: "onlyCurrent",
      },
    ]);
    expect(buildCompareRows({ bar: 2 }, undefined)).toEqual([
      {
        field: "bar",
        prevValue: 2,
        currentValue: undefined,
        status: "onlyPrev",
      },
    ]);
  });
});
